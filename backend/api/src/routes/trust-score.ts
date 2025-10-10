import { Router } from 'express';
import { auth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { TrustScoreService } from '../services/trust-score-service';

const router = Router();
const trustScoreService = new TrustScoreService();

router.get('/current', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const trustScore = await prisma.trustScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    });

    if (!trustScore) {
      return res.status(404).json({ error: 'Trust score not found' });
    }

    res.json({
      score: trustScore.score,
      breakdown: trustScore.breakdown,
      insights: trustScore.insights,
      calculatedAt: trustScore.calculatedAt,
    });
  } catch (error) {
    console.error('Error fetching trust score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/recalculate', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { linkedAccounts: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newScore = await trustScoreService.calculateTrustScore(user);
    
    const suiService = new (await import('../services/sui-service')).SuiService();
    await suiService.updateTrustScore(
      user.walletAddress,
      newScore.score,
      `trust-score-${Date.now()}`
    );

    res.json({
      score: newScore.score,
      breakdown: newScore.breakdown,
      insights: newScore.insights,
      calculatedAt: newScore.calculatedAt,
    });
  } catch (error) {
    console.error('Error recalculating trust score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 30;

    const scores = await prisma.trustScore.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    });

    res.json(scores);
  } catch (error) {
    console.error('Error fetching score history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as trustScoreRouter };