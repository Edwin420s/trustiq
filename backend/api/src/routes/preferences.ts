import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';

const router = Router();

const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  scoreUpdateAlerts: z.boolean().optional(),
  verificationAlerts: z.boolean().optional(),
  badgeMintAlerts: z.boolean().optional(),
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await prisma.userPreferences.create({
        data: { userId },
      });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', auth, validate(preferencesSchema), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const preferencesData = req.body;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: preferencesData,
      create: {
        userId,
        ...preferencesData,
      },
    });

    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as preferencesRouter };