import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateJWT, verifySignature } from '../lib/auth';
import { SuiService } from '../services/sui-service';

const router = Router();

const walletLoginSchema = z.object({
  walletAddress: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  signature: z.string(),
  message: z.string(),
});

const oauthLinkSchema = z.object({
  provider: z.enum(['github', 'linkedin']),
  code: z.string(),
});

router.post('/wallet/login', validate(walletLoginSchema), async (req: any, res: any) => {
  try {
    const { walletAddress, signature, message } = req.body;

    const isValid = await verifySignature(walletAddress, signature, message);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { 
        linkedAccounts: true, 
        trustScores: { 
          orderBy: { calculatedAt: 'desc' },
          take: 1 
        } 
      },
    });

    if (!user) {
      const did = `did:trustiq:sui:${walletAddress}`;
      user = await prisma.user.create({
        data: { walletAddress, did },
        include: { linkedAccounts: true, trustScores: true },
      });

      const sui = new SuiService();
      await sui.createTrustProfile(walletAddress, did, 'initial');
    }

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

router.post('/oauth/link', auth, validate(oauthLinkSchema), async (req: any, res: any) => {
  try {
    const { provider, code } = req.body;
    const userId = (req as any).user.id;

    const accountData = await exchangeOAuthCode(provider, code);
    const linkedAccount = await prisma.linkedAccount.upsert({
      where: {
        provider_username: { provider, username: accountData.username },
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

    await triggerTrustRecalculation(userId);

    const sui = new SuiService();
    await sui.addVerifiedAccount(
      (req as any).user.walletAddress,
      provider,
      accountData.username,
      Buffer.from(JSON.stringify(accountData)).toString('hex'),
      accountData.id
    );

    res.json({ success: true, account: linkedAccount });
  } catch (error) {
    console.error('OAuth linking error:', error);
    res.status(500).json({ error: 'Failed to link account' });
  }
});

async function exchangeOAuthCode(provider: string, code: string): Promise<any> {
  if (provider === 'github') {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    const accessToken = data.access_token;

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const userData = await userResponse.json();
    return {
      id: userData.id,
      username: userData.login,
      name: userData.name,
      avatar: userData.avatar_url,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
    };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function triggerTrustRecalculation(userId: string): Promise<void> {
  const queue = new QueueService();
  await queue.queueTrustScoreCalculation(userId);
}

export { router as authRouter };