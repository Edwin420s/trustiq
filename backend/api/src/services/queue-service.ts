import Queue from 'bull';
import { env } from '@trustiq/shared-config';
import { TrustScoreService } from './trust-score-service';
import { SuiService } from './sui-service';
import { IPFSService } from './ipfs-service';
import { prisma } from '../lib/prisma';

export class QueueService {
  private trustScoreQueue: Queue.Queue;
  private verificationQueue: Queue.Queue;
  private blockchainQueue: Queue.Queue;

  constructor() {
    this.trustScoreQueue = new Queue('trust score calculation', env.REDIS_URL);
    this.verificationQueue = new Queue('account verification', env.REDIS_URL);
    this.blockchainQueue = new Queue('blockchain operations', env.REDIS_URL);

    this.setupProcessors();
  }

  private setupProcessors() {
    // Trust score calculation processor
    this.trustScoreQueue.process('calculate-score', async (job) => {
      const { userId } = job.data;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { linkedAccounts: true },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const trustScoreService = new TrustScoreService();
      const score = await trustScoreService.calculateTrustScore(user);

      // Store score in database
      await prisma.trustScore.create({
        data: {
          userId,
          score: score.score,
          breakdown: score.breakdown,
          insights: score.insights,
        },
      });

      // Update blockchain
      const ipfsService = new IPFSService();
      const metadataCid = await ipfsService.uploadMetadata({
        score: score.score,
        breakdown: score.breakdown,
        calculatedAt: score.calculatedAt,
      });

      const suiService = new SuiService();
      await suiService.updateTrustScore(user.walletAddress, score.score, metadataCid);

      return { score: score.score, cid: metadataCid };
    });

    // Account verification processor
    this.verificationQueue.process('verify-account', async (job) => {
      const { accountId, verificationData } = job.data;
      
      // Verify account logic here
      // This would involve calling external APIs, validating data, etc.
      
      await prisma.linkedAccount.update({
        where: { id: accountId },
        data: {
          verified: true,
          verificationDate: new Date(),
          metadata: {
            ...verificationData,
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      // Trigger trust score recalculation
      const account = await prisma.linkedAccount.findUnique({
        where: { id: accountId },
        include: { user: true },
      });

      if (account) {
        await this.trustScoreQueue.add('calculate-score', {
          userId: account.userId,
        });
      }

      return { accountId, status: 'verified' };
    });

    // Blockchain operations processor
    this.blockchainQueue.process('update-profile', async (job) => {
      const { walletAddress, score, metadata } = job.data;
      
      const suiService = new SuiService();
      const ipfsService = new IPFSService();

      const metadataCid = await ipfsService.uploadMetadata(metadata);
      const transactionHash = await suiService.updateTrustScore(walletAddress, score, metadataCid);

      return { transactionHash, cid: metadataCid };
    });
  }

  async queueTrustScoreCalculation(userId: string) {
    return this.trustScoreQueue.add('calculate-score', { userId });
  }

  async queueAccountVerification(accountId: string, verificationData: any) {
    return this.verificationQueue.add('verify-account', { accountId, verificationData });
  }

  async queueBlockchainUpdate(walletAddress: string, score: number, metadata: any) {
    return this.blockchainQueue.add('update-profile', { walletAddress, score, metadata });
  }

  async getQueueStats() {
    const [trustScoreStats, verificationStats, blockchainStats] = await Promise.all([
      this.trustScoreQueue.getJobCounts(),
      this.verificationQueue.getJobCounts(),
      this.blockchainQueue.getJobCounts(),
    ]);

    return {
      trustScore: trustScoreStats,
      verification: verificationStats,
      blockchain: blockchainStats,
    };
  }
}