import { Router } from 'express';
import { auth } from '../middleware/auth';
import { SuiService } from '../services/sui-service';

const router = Router();

router.get('/profile', auth, async (req, res) => {
  try {
    const walletAddress = (req as any).user.walletAddress;
    const suiService = new SuiService();

    const profile = await suiService.getTrustProfile(walletAddress);

    if (!profile) {
      return res.status(404).json({ error: 'Blockchain profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching blockchain profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mint-badge', auth, async (req, res) => {
  try {
    const walletAddress = (req as any).user.walletAddress;
    const suiService = new SuiService();

    // This would mint a soulbound badge for the user
    // For now, return mock data
    const transactionHash = await suiService.updateTrustScore(
      walletAddress,
      75, // Example score
      `badge-mint-${Date.now()}`
    );

    res.json({
      transactionHash,
      badgeType: 'trust_score_verified',
      status: 'minted',
    });
  } catch (error) {
    console.error('Error minting badge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as blockchainRouter };