import { Router } from 'express';
import { auth } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics-service';

const router = Router();
const analyticsService = new AnalyticsService();

router.get('/overview', auth, async (req, res) => {
  try {
    const [userGrowth, scoreDistribution, platformUsage, verificationMetrics, systemHealth] = await Promise.all([
      analyticsService.getUserGrowth(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date()
      ),
      analyticsService.getTrustScoreDistribution(),
      analyticsService.getPlatformUsage(),
      analyticsService.getVerificationMetrics(),
      analyticsService.getSystemHealth(),
    ]);

    res.json({
      userGrowth,
      scoreDistribution,
      platformUsage,
      verificationMetrics,
      systemHealth,
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user-growth', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end as string) : new Date();

    const userGrowth = await analyticsService.getUserGrowth(startDate, endDate);

    res.json(userGrowth);
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/score-distribution', auth, async (req, res) => {
  try {
    const distribution = await analyticsService.getTrustScoreDistribution();

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching score distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/platform-usage', auth, async (req, res) => {
  try {
    const platformUsage = await analyticsService.getPlatformUsage();

    res.json(platformUsage);
  } catch (error) {
    console.error('Error fetching platform usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/system-health', auth, async (req, res) => {
  try {
    const systemHealth = await analyticsService.getSystemHealth();

    res.json(systemHealth);
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as analyticsRouter };