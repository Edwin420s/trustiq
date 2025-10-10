import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateJWT } from '../lib/auth';
import { SuiService } from '../services/sui-service';

const router = Router();

const walletLoginSchema = z.object({
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  signature: z.string(),
  message: z.string(),
});

const oauthLoginSchema = z.object({
  provider: z.enum(['github', 'linkedin']),
  code: z.string(),
});

// Wallet-based authentication
router.post('/wallet/login', validate(walletLoginSchema), async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // Verify signature (pseudo-code - implement based on your crypto library)
    const isValid = await verifySignature(walletAddress, signature, message);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { linkedAccounts: true, trustScores: true },
    });

    if (!user) {
      // Create new user and DID
      const did = `did:trustiq:sui:${walletAddress}`;
      
      user = await prisma.user.create({
        data: {
          walletAddress,
          did,
          linkedAccounts: { create: [] },
          trustScores: { create: [] },
        },
        include: { linkedAccounts: true, trustScores: true },
      });

      // Initialize on-chain profile
      const suiService = new SuiService();
      await suiService.createTrustProfile(walletAddress, did);
    }

    // Generate JWT
    const token = generateJWT(user);

    res.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        did: user.did,
        trustScore: user.trustScores[0]?.score || 50,
      },
      token,
    });
  } catch (error) {
    console.error('Wallet login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth account linking
router.post('/oauth/link', auth, validate(oauthLoginSchema), async (req, res) => {
  try {
    const { provider, code } = req.body;
    const userId = (req as any).user.id;

    // Exchange code for access token and fetch user data
    const accountData = await exchangeOAuthCode(provider, code);
    
    // Verify and store account
    const linkedAccount = await prisma.linkedAccount.upsert({
      where: {
        provider_username: {
          provider,
          username: accountData.username,
        },
      },
      update: {
        verified: true,
        verificationDate: new Date(),
        metadata: accountData,
      },
      create: {
        userId,
        provider,
        username: accountData.username,
        verified: true,
        verificationDate: new Date(),
        metadata: accountData,
      },
    });

    // Trigger trust score recalculation
    await recalculateTrustScore(userId);

    res.json({ success: true, account: linkedAccount });
  } catch (error) {
    console.error('OAuth linking error:', error);
    res.status(500).json({ error: 'Failed to link account' });
  }
});

// Helper functions (implement based on your crypto and OAuth providers)
async function verifySignature(address: string, signature: string, message: string): Promise<boolean> {
  // Implement signature verification using @mysten/sui.js or similar
  return true;
}

async function exchangeOAuthCode(provider: string, code: string): Promise<any> {
  // Implement OAuth flow for GitHub, LinkedIn, etc.
  return { username: 'testuser', id: '123' };
}

async function recalculateTrustScore(userId: string): Promise<void> {
  // Trigger trust score calculation
}

export { router as authRouter };