import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';

const router = Router();

const verificationRequestSchema = z.object({
  userId: z.string().uuid(),
  fields: z.array(z.string()).optional(),
});

router.post('/request', auth, validate(verificationRequestSchema), async (req, res) => {
  try {
    const { userId, fields = ['basic'] } = req.body;
    const requesterId = (req as any).user.id;

    // Check if requester has permission to verify this user
    // This could involve organization checks, API key validation, etc.

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

    const verificationData = {
      did: user.did,
      trustScore: user.trustScores[0]?.score || 50,
      verifiedAccounts: user.linkedAccounts.map(account => ({
        provider: account.provider,
        username: account.username,
        verifiedAt: account.verificationDate,
      })),
      verificationTimestamp: new Date().toISOString(),
      verifiedBy: requesterId,
    };

    res.json(verificationData);
  } catch (error) {
    console.error('Error processing verification request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/organizations', auth, async (req, res) => {
  try {
    // This would return organizations that can verify users
    // For now, return mock data
    const organizations = [
      {
        id: 'org_1',
        name: 'TechCorp Inc.',
        verified: true,
        verificationTypes: ['employment', 'skill'],
      },
      {
        id: 'org_2',
        name: 'Web3 DAO',
        verified: true,
        verificationTypes: ['membership', 'contribution'],
      },
    ];

    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as verificationRouter };