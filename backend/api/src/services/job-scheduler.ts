import { CronJob } from 'cron';
import { prisma } from '../lib/prisma';
import { logger } from './logger-service';
import { emailService } from './email-service';
import { AnalyticsService } from './analytics-service';
import { MLPipeline } from '../../../ai-engine/app/services/ml_pipeline';
import { TrustScoreService } from './trust-score-service';

export class JobScheduler {
  private jobs: CronJob[] = [];
  private analyticsService = new AnalyticsService();
  private trustScoreService = new TrustScoreService();

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    // Daily trust score recalculation (2 AM UTC)
    this.jobs.push(new CronJob(
      '0 2 * * *',
      this.dailyScoreRecalculation.bind(this),
      null,
      true,
      'UTC'
    ));

    // Weekly analytics report (Monday 6 AM UTC)
    this.jobs.push(new CronJob(
      '0 6 * * 1',
      this.weeklyAnalyticsReport.bind(this),
      null,
      true,
      'UTC'
    ));

    // Monthly model retraining (1st of month 3 AM UTC)
    this.jobs.push(new CronJob(
      '0 3 1 * *',
      this.monthlyModelRetraining.bind(this),
      null,
      true,
      'UTC'
    ));

    // Cleanup old data (Daily 4 AM UTC)
    this.jobs.push(new CronJob(
      '0 4 * * *',
      this.dailyCleanup.bind(this),
      null,
      true,
      'UTC'
    ));

    // Health check (Every 30 minutes)
    this.jobs.push(new CronJob(
      '*/30 * * * *',
      this.healthCheck.bind(this),
      null,
      true,
      'UTC'
    ));

    logger.info('Job scheduler initialized with ${this.jobs.length} jobs');
  }

  private async dailyScoreRecalculation() {
    try {
      logger.info('Starting daily trust score recalculation');
      
      const users = await prisma.user.findMany({
        include: {
          linkedAccounts: true,
          trustScores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
      });

      let processed = 0;
      let updated = 0;

      for (const user of users) {
        try {
          const currentScore = user.trustScores[0]?.score;
          const newScore = await this.trustScoreService.calculateTrustScore(user);

          // Only update if score changed significantly (> 1 point)
          if (!currentScore || Math.abs(currentScore - newScore.score) > 1) {
            await prisma.trustScore.create({
              data: {
                userId: user.id,
                score: newScore.score,
                breakdown: newScore.breakdown,
                insights: newScore.insights,
              },
            });

            // Send email notification for significant changes
            if (currentScore && Math.abs(currentScore - newScore.score) > 5) {
              await this.sendScoreUpdateNotification(user, currentScore, newScore.score);
            }

            updated++;
          }

          processed++;

          // Small delay to avoid overwhelming the system
          if (processed % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          logger.error(`Error recalculating score for user ${user.id}`, error as Error);
        }
      }

      logger.info('Daily score recalculation completed', {
        processed,
        updated,
        successRate: ((processed - (processed - updated)) / processed) * 100,
      });

    } catch (error) {
      logger.error('Daily score recalculation failed', error as Error);
    }
  }

  private async weeklyAnalyticsReport() {
    try {
      logger.info('Generating weekly analytics report');

      const reportData = {
        userGrowth: await this.analyticsService.getUserGrowth(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date()
        ),
        scoreDistribution: await this.analyticsService.getTrustScoreDistribution(),
        platformUsage: await this.analyticsService.getPlatformUsage(),
        verificationMetrics: await this.analyticsService.getVerificationMetrics(),
        systemHealth: await this.analyticsService.getSystemHealth(),
      };

      // Store report in database
      await prisma.systemMetrics.create({
        data: {
          metric: 'weekly_analytics_report',
          value: 1,
          tags: reportData,
        },
      });

      // Send report to admin email (if configured)
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await emailService.sendEmail({
          to: adminEmail,
          subject: 'TrustIQ Weekly Analytics Report',
          template: 'analyticsReport',
          data: {
            ...reportData,
            period: 'week',
            generatedAt: new Date().toISOString(),
          },
        });
      }

      logger.info('Weekly analytics report generated successfully');

    } catch (error) {
      logger.error('Weekly analytics report generation failed', error as Error);
    }
  }

  private async monthlyModelRetraining() {
    try {
      logger.info('Starting monthly AI model retraining');

      // Get training data (last 3 months of user data with scores)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const trainingData = await prisma.user.findMany({
        where: {
          trustScores: {
            some: {
              calculatedAt: {
                gte: threeMonthsAgo,
              },
            },
          },
        },
        include: {
          linkedAccounts: true,
          trustScores: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (trainingData.length < 100) {
        logger.warn('Insufficient training data for model retraining', {
          userCount: trainingData.length,
          minimumRequired: 100,
        });
        return;
      }

      // Format data for ML pipeline
      const formattedData = trainingData.map(user => ({
        ...user,
        trust_score: user.trustScores[0]?.score || 50,
      }));

      // Initialize and train ML pipeline
      const mlPipeline = new MLPipeline();
      const trainingResult = await mlPipeline.train_ensemble_model(formattedData);

      // Save trained model
      const modelPath = `./models/trustiq_model_${Date.now()}.joblib`;
      await mlPipeline.save_models(modelPath);

      // Log training results
      await prisma.systemMetrics.create({
        data: {
          metric: 'model_training',
          value: trainingResult.ensemble_score,
          tags: {
            ...trainingResult,
            model_path: modelPath,
            training_samples: trainingData.length,
          },
        },
      });

      logger.info('Monthly model retraining completed', trainingResult);

    } catch (error) {
      logger.error('Monthly model retraining failed', error as Error);
    }
  }

  private async dailyCleanup() {
    try {
      logger.info('Starting daily data cleanup');

      const cleanupTasks = [
        // Delete old notifications (older than 90 days)
        prisma.notification.deleteMany({
          where: {
            createdAt: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Delete old audit logs (older than 1 year)
        prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Delete old API usage logs (older than 30 days)
        prisma.apiUsage.deleteMany({
          where: {
            createdAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Clean up expired sessions (implementation depends on session storage)
        this.cleanupExpiredSessions(),
      ];

      const results = await Promise.allSettled(cleanupTasks);

      const deletedCounts = results.map((result, index) => ({
        task: ['notifications', 'audit_logs', 'api_usage', 'sessions'][index],
        status: result.status,
        ...(result.status === 'fulfilled' ? { deleted: result.value } : { error: (result as any).reason }),
      }));

      logger.info('Daily data cleanup completed', { results: deletedCounts });

    } catch (error) {
      logger.error('Daily data cleanup failed', error as Error);
    }
  }

  private async healthCheck() {
    try {
      const checks = {
        database: await this.checkDatabaseHealth(),
        email: await this.checkEmailHealth(),
        blockchain: await this.checkBlockchainHealth(),
        cache: await this.checkCacheHealth(),
      };

      const allHealthy = Object.values(checks).every(check => check.healthy);

      await prisma.systemMetrics.create({
        data: {
          metric: 'health_check',
          value: allHealthy ? 1 : 0,
          tags: checks,
        },
      });

      if (!allHealthy) {
        logger.warn('Health check failed', { checks });
      }

    } catch (error) {
      logger.error('Health check execution failed', error as Error);
    }
  }

  private async sendScoreUpdateNotification(user: any, oldScore: number, newScore: number) {
    try {
      if (!user.email) return;

      await emailService.sendEmail({
        to: user.email,
        subject: 'Your TrustIQ Score Has Been Updated',
        template: 'trustScoreUpdate',
        data: {
          name: user.walletAddress?.slice(0, 8) + '...',
          oldScore,
          newScore,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
          insights: [], // Would come from score calculation
        },
      });
    } catch (error) {
      logger.error('Failed to send score update notification', error as Error, {
        userId: user.id,
      });
    }
  }

  private async cleanupExpiredSessions(): Promise<number> {
    // Implementation depends on session storage (Redis, database, etc.)
    // This is a placeholder implementation
    return 0;
  }

  private async checkDatabaseHealth(): Promise<{ healthy: boolean; responseTime: number }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { healthy: true, responseTime: Date.now() - start };
    } catch (error) {
      return { healthy: false, responseTime: Date.now() - start };
    }
  }

  private async checkEmailHealth(): Promise<{ healthy: boolean }> {
    try {
      const healthy = await emailService.verifyConnection();
      return { healthy };
    } catch (error) {
      return { healthy: false };
    }
  }

  private async checkBlockchainHealth(): Promise<{ healthy: boolean }> {
    // Implementation would check Sui blockchain connection
    // Placeholder implementation
    return { healthy: true };
  }

  private async checkCacheHealth(): Promise<{ healthy: boolean }> {
    // Implementation would check Redis connection
    // Placeholder implementation
    return { healthy: true };
  }

  // Manual job triggering for testing and maintenance
  async triggerJob(jobName: string): Promise<{ success: boolean; message: string }> {
    const jobMap: { [key: string]: Function } = {
      'dailyScoreRecalculation': this.dailyScoreRecalculation.bind(this),
      'weeklyAnalyticsReport': this.weeklyAnalyticsReport.bind(this),
      'monthlyModelRetraining': this.monthlyModelRetraining.bind(this),
      'dailyCleanup': this.dailyCleanup.bind(this),
      'healthCheck': this.healthCheck.bind(this),
    };

    const job = jobMap[jobName];

    if (!job) {
      return { success: false, message: `Unknown job: ${jobName}` };
    }

    try {
      await job();
      return { success: true, message: `Job ${jobName} executed successfully` };
    } catch (error) {
      logger.error(`Manual job execution failed: ${jobName}`, error as Error);
      return { success: false, message: `Job execution failed: ${(error as Error).message}` };
    }
  }

  // Get job status and next run times
  getJobStatus() {
    return this.jobs.map(job => ({
      name: job.name || 'unnamed',
      running: job.running,
      lastDate: job.lastDate(),
      nextDate: job.nextDate(),
    }));
  }

  // Graceful shutdown
  async shutdown() {
    this.jobs.forEach(job => job.stop());
    logger.info('Job scheduler stopped');
  }
}

export const jobScheduler = new JobScheduler();