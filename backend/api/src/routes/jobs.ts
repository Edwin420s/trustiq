import { Router } from 'express';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/role-auth';
import { jobScheduler } from '../services/job-scheduler';
import { logger } from '../services/logger-service';

const router = Router();

// Get job status (admin only)
router.get('/status', auth, requireAdmin, async (req, res) => {
  try {
    const status = jobScheduler.getJobStatus();
    
    res.json({
      jobs: status,
      timestamp: new Date().toISOString(),
    });
  } catch