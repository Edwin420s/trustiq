import { verifyMessage } from '@mysten/sui.js/verify';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromHEX } from '@mysten/sui.js/utils';
import { prisma } from '../lib/prisma';
import { generateJWT } from '../lib/auth';
import { logger } from './logger-service';
import { NotificationService } from './notification-service';

export interface Web3AuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
  timestamp: number;
}

export interface Web3AuthResponse {
  user: {
    id: string;
    walletAddress: string;
    did: string;
    trustScore: number;
  };
  token: string;
  isNewUser: boolean;
}

export class Web3AuthService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async authenticate(request: Web3AuthRequest): Promise<Web3AuthResponse> {
    try {
      // Validate timestamp to prevent replay attacks
      this.validateTimestamp(request.timestamp);

      // Verify the signature
      const isValidSignature = await this.verifySignature(
        request.walletAddress,
        request.signature,
        request.message
      );

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress: request.walletAddress },
        include: { 
          trustScores: { 
            orderBy: { calculatedAt: 'desc' },
            take: 1 
          } 
        },
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await this.createNewUser(request.walletAddress);
        isNewUser = true;

        // Send welcome notification
        await this.notificationService.sendWelcomeNotification(user.id);
        
        logger.logAuthEvent(user.id, 'USER_CREATED', {
          walletAddress: request.walletAddress,
        });
      }

      // Generate JWT token
      const token = generateJWT(user);

      // Log successful authentication
      logger.logAuthEvent(user.id, 'LOGIN_SUCCESS', {
        walletAddress: request.walletAddress,
        isNewUser,
      });

      return {
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          did: user.did,
          trustScore: user.trustScores[0]?.score || 50,
        },
        token,
        isNewUser,
      };

    } catch (error) {
      logger.logAuthEvent('unknown', 'LOGIN_FAILED', {
        walletAddress: request.walletAddress,
        error: (error as Error).message,
      });
      
      throw error;
    }
  }

  private async verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message);
      
      // Verify the signature using Sui's verification
      const isValid = await verifyMessage(
        Buffer.from(messageBytes).toString('hex'),
        signature,
        walletAddress
      );

      return isValid;
    } catch (error) {
      logger.error('Signature verification failed', error as Error, {
        walletAddress,
      });
      return false;
    }
  }

  private validateTimestamp(timestamp: number): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (Math.abs(now - timestamp) > fiveMinutes) {
      throw new Error('Timestamp is too far from current time');
    }
  }

  private async createNewUser(walletAddress: string) {
    const did = `did:trustiq:sui:${walletAddress}`;

    return await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          walletAddress,
          did,
        },
      });

      // Create initial trust score
      await tx.trustScore.create({
        data: {
          userId: user.id,
          score: 50, // Default starting score
          breakdown: {
            consistency: 50,
            skillDepth: 50,
            peerValidation: 50,
            engagementQuality: 50,
            anomalyFactor: 0,
          },
          insights: ['Welcome to TrustIQ! Connect your accounts to build your reputation.'],
        },
      });

      // Create user preferences
      await tx.userPreferences.create({
        data: {
          userId: user.id,
        },
      });

      // Create user tier
      await tx.userTier.create({
        data: {
          userId: user.id,
          tier: 'FREE',
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: { trustScores: true },
      }) as any;
    });
  }

  async generateAuthMessage(walletAddress: string): Promise<string> {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    const message = `TrustIQ Authentication\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}\n\nSign this message to authenticate with TrustIQ.`;

    // Store the expected message for verification
    await this.storeAuthChallenge(walletAddress, message, timestamp);

    return message;
  }

  private async storeAuthChallenge(
    walletAddress: string, 
    message: string, 
    timestamp: number
  ): Promise<void> {
    // In production, you would store this in Redis with expiration
    // For now, we'll just log it
    logger.debug('Auth challenge generated', {
      walletAddress,
      timestamp,
      messageHash: Buffer.from(message).toString('base64'),
    });
  }

  async logout(userId: string): Promise<void> {
    // Invalidate any active sessions or tokens
    // This could involve adding tokens to a blacklist
    
    logger.logAuthEvent(userId, 'LOGOUT', {
      timestamp: new Date().toISOString(),
    });
  }

  async disconnectWallet(userId: string): Promise<void> {
    // This would remove the wallet connection
    // For TrustIQ, since wallet is primary identity, this might mean account deletion
    
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.logAuthEvent(userId, 'ACCOUNT_DELETED', {
      timestamp: new Date().toISOString(),
    });
  }

  async getAuthSessions(userId: string): Promise<any[]> {
    // Return active sessions for the user
    // This would query a sessions table
    
    return []; // Placeholder
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    // Revoke a specific session
    logger.logAuthEvent(userId, 'SESSION_REVOKED', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  // Multi-wallet support (future feature)
  async linkAdditionalWallet(
    userId: string, 
    walletAddress: string, 
    signature: string, 
    message: string
  ): Promise<void> {
    // Verify the signature
    const isValid = await this.verifySignature(walletAddress, signature, message);
    
    if (!isValid) {
      throw new Error('Invalid signature for additional wallet');
    }

    // Check if wallet is already linked to another account
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existingUser) {
      throw new Error('Wallet address already linked to another account');
    }

    // In a real implementation, you would have a separate table for linked wallets
    // For now, we'll just log the request
    logger.logAuthEvent(userId, 'WALLET_LINK_REQUEST', {
      newWalletAddress: walletAddress,
    });
  }
}