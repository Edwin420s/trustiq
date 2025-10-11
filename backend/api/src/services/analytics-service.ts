import { prisma } from '../lib/prisma';

export class AnalyticsService {
  async getUserGrowth(startDate: Date, endDate: Date) {
    return await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getTrustScoreDistribution() {
    const scores = await prisma.trustScore.findMany({
      where: {
        calculatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
      distinct: ['userId'],
    });

    const distribution = {
      excellent: 0, // 90-100
      good: 0,      // 75-89
      average: 0,   // 60-74
      poor: 0,      // 40-59
      veryPoor: 0,  // 0-39
    };

    scores.forEach(score => {
      if (score.score >= 90) distribution.excellent++;
      else if (score.score >= 75) distribution.good++;
      else if (score.score >= 60) distribution.average++;
      else if (score.score >= 40) distribution.poor++;
      else distribution.veryPoor++;
    });

    return distribution;
  }

  async getPlatformUsage() {
    const accounts = await prisma.linkedAccount.groupBy({
      by: ['provider'],
      _count: {
        id: true,
      },
      where: {
        verified: true,
      },
    });

    return accounts.reduce((acc, account) => {
      acc[account.provider] = account._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  async getVerificationMetrics() {
    const totalAccounts = await prisma.linkedAccount.count();
    const verifiedAccounts = await prisma.linkedAccount.count({
      where: { verified: true },
    });
    const verificationRate = totalAccounts > 0 ? (verifiedAccounts / totalAccounts) * 100 : 0;

    return {
      totalAccounts,
      verifiedAccounts,
      verificationRate,
      unverifiedAccounts: totalAccounts - verifiedAccounts,
    };
  }

  async getSystemHealth() {
    const [userCount, scoreCount, accountCount, recentScores] = await Promise.all([
      prisma.user.count(),
      prisma.trustScore.count(),
      prisma.linkedAccount.count(),
      prisma.trustScore.count({
        where: {
          calculatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      userCount,
      scoreCount,
      accountCount,
      recentScores,
      averageScoresPerUser: userCount > 0 ? scoreCount / userCount : 0,
      averageAccountsPerUser: userCount > 0 ? accountCount / userCount : 0,
    };
  }
}