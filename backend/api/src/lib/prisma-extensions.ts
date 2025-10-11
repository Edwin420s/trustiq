import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async create({ args, query }) {
        // Add audit log for user creation
        const result = await query(args);
        
        await prisma.auditLog.create({
          data: {
            action: 'USER_CREATED',
            resource: 'User',
            resourceId: result.id,
            userId: result.id,
            details: {
              walletAddress: result.walletAddress,
              did: result.did,
            },
          },
        });
        
        // Create default user preferences
        await prisma.userPreferences.create({
          data: {
            userId: result.id,
          },
        });
        
        // Create default user tier
        await prisma.userTier.create({
          data: {
            userId: result.id,
            tier: 'FREE',
          },
        });
        
        return result;
      },
    },
    
    trustScore: {
      async create({ args, query }) {
        const result = await query(args);
        
        // Create notification for trust score update
        await prisma.notification.create({
          data: {
            userId: args.data.userId,
            type: 'TRUST_SCORE_UPDATE',
            title: 'Trust Score Updated',
            message: `Your trust score has been updated to ${args.data.score}`,
            data: {
              oldScore: null, // Would need previous score
              newScore: args.data.score,
              breakdown: args.data.breakdown,
            },
          },
        });
        
        // Log trust score update
        await prisma.auditLog.create({
          data: {
            action: 'TRUST_SCORE_UPDATED',
            resource: 'TrustScore',
            resourceId: result.id,
            userId: args.data.userId,
            details: {
              score: args.data.score,
              breakdown: args.data.breakdown,
            },
          },
        });
        
        return result;
      },
    },
    
    linkedAccount: {
      async update({ args, query }) {
        const result = await query(args);
        
        // If account is being verified, create notification
        if (args.data.verified && args.data.verified === true) {
          await prisma.notification.create({
            data: {
              userId: result.userId,
              type: 'ACCOUNT_VERIFIED',
              title: 'Account Verified',
              message: `Your ${result.provider} account has been verified`,
              data: {
                provider: result.provider,
                username: result.username,
              },
            },
          });
        }
        
        return result;
      },
    },
  },
  
  model: {
    user: {
      async getTrustScoreHistory(userId: string, limit: number = 30) {
        return await prisma.trustScore.findMany({
          where: { userId },
          orderBy: { calculatedAt: 'desc' },
          take: limit,
        });
      },
      
      async getLinkedAccounts(userId: string) {
        return await prisma.linkedAccount.findMany({
          where: { userId },
          orderBy: { provider: 'asc' },
        });
      },
      
      async getNotifications(userId: string, limit: number = 50) {
        return await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      },
      
      async getUnreadNotificationCount(userId: string) {
        return await prisma.notification.count({
          where: { 
            userId, 
            read: false 
          },
        });
      },
    },
    
    auditLog: {
      async logSecurityEvent(
        userId: string | null, 
        action: string, 
        resource: string, 
        details: any
      ) {
        return await prisma.auditLog.create({
          data: {
            userId,
            action,
            resource,
            details,
          },
        });
      },
    },
    
    systemMetrics: {
      async recordMetric(metric: string, value: number, tags: any = {}) {
        return await prisma.systemMetrics.create({
          data: {
            metric,
            value,
            tags,
          },
        });
      },
      
      async getMetricStats(metric: string, hours: number = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        return await prisma.systemMetrics.findMany({
          where: {
            metric,
            timestamp: {
              gte: since,
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        });
      },
    },
  },
});

export { prisma as extendedPrisma };