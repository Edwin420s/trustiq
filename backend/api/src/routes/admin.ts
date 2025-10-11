import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { extendedPrisma } from '../lib/prisma-extensions';
import { AnalyticsService } from '../services/analytics-service';
import { logger } from '../services/logger-service';

const router = Router();
const analyticsService = new AnalyticsService();

// Admin middleware - check if user is admin
const adminAuth = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const userStatsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Get platform statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const [userStats, scoreStats, accountStats, systemStats] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Trust score statistics
      prisma.trustScore.aggregate({
        _avg: {
          score: true,
        },
        _min: {
          score: true,
        },
        _max: {
          score: true,
        },
        _count: {
          id: true,
        },
      }),
      
      // Account verification statistics
      prisma.linkedAccount.groupBy({
        by: ['provider', 'verified'],
        _count: {
          id: true,
        },
      }),
      
      // System statistics
      prisma.systemMetrics.findMany({
        where: {
          metric: {
            in: ['response_time', 'error_rate', 'active_users'],
          },
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      }),
    ]);

    res.json({
      users: {
        growth: userStats,
        total: await prisma.user.count(),
      },
      scores: scoreStats,
      accounts: accountStats,
      system: systemStats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user analytics
router.get('/users/analytics', auth, adminAuth, validate(userStatsSchema), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const userGrowth = await analyticsService.getUserGrowth(start, end);
    const scoreDistribution = await analyticsService.getTrustScoreDistribution();
    const platformUsage = await analyticsService.getPlatformUsage();
    const verificationMetrics = await analyticsService.getVerificationMetrics();

    res.json({
      userGrowth,
      scoreDistribution,
      platformUsage,
      verificationMetrics,
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system health
router.get('/system/health', auth, adminAuth, async (req, res) => {
  try {
    const systemHealth = await analyticsService.getSystemHealth();
    
    // Additional system metrics
    const databaseHealth = await checkDatabaseHealth();
    const cacheHealth = await checkCacheHealth();
    const blockchainHealth = await checkBlockchainHealth();

    res.json({
      ...systemHealth,
      database: databaseHealth,
      cache: cacheHealth,
      blockchain: blockchainHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs
router.get('/audit-logs', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              walletAddress: true,
              did: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get API usage statistics
router.get('/api-usage', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, apiKeyId } = req.query;
    
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    if (apiKeyId) where.apiKeyId = apiKeyId;

    const usageStats = await prisma.apiUsage.groupBy({
      by: ['endpoint', 'method', 'statusCode'],
      where,
      _count: {
        id: true,
      },
      _avg: {
        responseTime: true,
      },
    });

    const totalRequests = await prisma.apiUsage.count({ where });
    const averageResponseTime = await prisma.apiUsage.aggregate({
      where,
      _avg: {
        responseTime: true,
      },
    });

    res.json({
      usageStats,
      summary: {
        totalRequests,
        averageResponseTime: averageResponseTime._avg.responseTime,
      },
    });
  } catch (error) {
    console.error('Error fetching API usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manage users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const where: any = {};
    if (search) {
      where.OR = [
        { walletAddress: { contains: search as string, mode: 'insensitive' } },
        { did: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          linkedAccounts: {
            select: {
              provider: true,
              username: true,
              verified: true,
            },
          },
          trustScores: {
            orderBy: {
              calculatedAt: 'desc',
            },
            take: 1,
          },
          userTier: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user tier
router.patch('/users/:userId/tier', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    if (!['FREE', 'PREMIUM', 'ENTERPRISE'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const userTier = await prisma.userTier.upsert({
      where: { userId },
      update: { tier },
      create: {
        userId,
        tier,
      },
    });

    // Log the tier change
    await extendedPrisma.auditLog.logSecurityEvent(
      req.user.id,
      'USER_TIER_UPDATED',
      'UserTier',
      {
        targetUserId: userId,
        newTier: tier,
        updatedBy: req.user.id,
      }
    );

    res.json(userTier);
  } catch (error) {
    console.error('Error updating user tier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System maintenance endpoints
router.post('/system/maintenance', auth, adminAuth, async (req, res) => {
  try {
    const { action, message } = req.body;

    // In a real implementation, this would trigger maintenance mode
    // For now, just log the action
    await extendedPrisma.auditLog.logSecurityEvent(
      req.user.id,
      'MAINTENANCE_MODE_' + action.toUpperCase(),
      'System',
      { message }
    );

    logger.info(`Maintenance ${action} initiated by admin ${req.user.id}`, {
      action,
      message,
      adminId: req.user.id,
    });

    res.json({ 
      success: true, 
      message: `Maintenance mode ${action} initiated` 
    });
  } catch (error) {
    console.error('Error managing maintenance mode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check functions
async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkCacheHealth() {
  try {
    // This would check Redis connection
    // For now, return mock health
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkBlockchainHealth() {
  try {
    // This would check Sui blockchain connection
    // For now, return mock health
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };
  }
}

export { router as adminRouter };