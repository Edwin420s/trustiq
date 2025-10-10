import { Router } from 'express';
import { auth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/profile', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        linkedAccounts: true,
        trustScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1
        }
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      walletAddress: user.walletAddress,
      did: user.did,
      trustScore: user.trustScores[0]?.score || 50,
      scoreBreakdown: user.trustScores[0]?.breakdown || {},
      insights: user.trustScores[0]?.insights || [],
      linkedAccounts: user.linkedAccounts,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/verification', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        linkedAccounts: {
          where: { verified: true }
        },
        trustScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1
        }
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only return public verification data
    res.json({
      did: user.did,
      trustScore: user.trustScores[0]?.score || 50,
      verifiedAccounts: user.linkedAccounts.map(account => ({
        provider: account.provider,
        username: account.username,
        verifiedAt: account.verificationDate,
      })),
    });
  } catch (error) {
    console.error('Error fetching user verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/accounts/:accountId', auth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = (req as any).user.id;

    const account = await prisma.linkedAccount.findFirst({
      where: { 
        id: accountId,
        userId 
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await prisma.linkedAccount.delete({
      where: { id: accountId },
    });

    // Trigger trust score recalculation
    // This would be handled by a background job in production

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as userRouter };