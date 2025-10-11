import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { cacheService } from '../services/cache-service';
import { logger } from '../services/logger-service';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  onLimitReached?: (req: Request, res: Response) => void;
}

export class AdvancedRateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs() {
    // General API limits
    this.configs.set('general', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests from this IP, please try again later.',
    });

    // Authentication endpoints
    this.configs.set('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per window
      message: 'Too many authentication attempts, please try again later.',
      skip: (req) => req.method === 'GET', // Skip for GET requests
      onLimitReached: (req, res) => {
        logger.logSecurityEvent('rate_limit_auth_reached', 'medium', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
        });
      },
    });

    // Trust score calculation
    this.configs.set('trust-score', {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 score calculations per hour
      message: 'Too many trust score calculations, please try again later.',
      keyGenerator: (req) => {
        const userId = (req as any).user?.id;
        return userId ? `trust-score:${userId}` : req.ip;
      },
    });

    // Blockchain operations
    this.configs.set('blockchain', {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 5, // 5 blockchain operations per 5 minutes
      message: 'Too many blockchain operations, please try again later.',
      keyGenerator: (req) => {
        const userId = (req as any).user?.id;
        return userId ? `blockchain:${userId}` : req.ip;
      },
    });

    // API key based limits
    this.configs.set('api-key', {
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute per API key
      keyGenerator: (req) => {
        return req.headers['x-api-key'] as string || 'anonymous';
      },
      message: 'API rate limit exceeded for this key.',
    });

    // File upload limits
    this.configs.set('upload', {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 uploads per hour
      message: 'Too many file uploads, please try again later.',
    });
  }

  getMiddleware(configKey: string) {
    const config = this.configs.get(configKey);
    if (!config) {
      throw new Error(`Rate limit config not found: ${configKey}`);
    }

    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: {
        error: 'Rate limit exceeded',
        message: config.message,
        retryAfter: `${Math.ceil(config.windowMs / 1000)} seconds`,
      },
      keyGenerator: config.keyGenerator || ((req) => req.ip),
      skip: config.skip,
      onLimitReached: config.onLimitReached,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.logSecurityEvent('rate_limit_exceeded', 'low', {
          config: configKey,
          ip: req.ip,
          endpoint: req.path,
          method: req.method,
          key: config.keyGenerator ? config.keyGenerator(req) : req.ip,
        });

        res.status(429).json({
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: `${Math.ceil(config.windowMs / 1000)} seconds`,
        });
      },
    });
  }

  // Dynamic rate limiting based on user tier
  async getDynamicRateLimit(userId: string, endpoint: string) {
    try {
      // Get user tier from database or cache
      const userTier = await this.getUserTier(userId);
      
      const tierLimits = {
        free: { windowMs: 60000, max: 10 }, // 10 requests per minute
        premium: { windowMs: 60000, max: 100 }, // 100 requests per minute
        enterprise: { windowMs: 60000, max: 1000 }, // 1000 requests per minute
      };

      const limit = tierLimits[userTier] || tierLimits.free;

      return rateLimit({
        windowMs: limit.windowMs,
        max: limit.max,
        keyGenerator: (req) => `dynamic:${userId}:${endpoint}`,
        message: `Rate limit exceeded for your ${userTier} tier.`,
      });
    } catch (error) {
      // Fallback to free tier limits
      return rateLimit({
        windowMs: 60000,
        max: 10,
        keyGenerator: (req) => `dynamic:${userId}:${endpoint}`,
        message: 'Rate limit exceeded.',
      });
    }
  }

  private async getUserTier(userId: string): Promise<'free' | 'premium' | 'enterprise'> {
    // Implementation would check user subscription tier
    // This is a simplified version
    return 'free';
  }

  // Burst rate limiting for short periods
  getBurstLimit(config: { windowMs: number; max: number; burstWindowMs: number; burstMax: number }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = `burst:${req.ip}:${req.path}`;
      
      try {
        // Check burst limit
        const burstResult = await cacheService.checkRateLimit(
          `${key}:burst`,
          config.burstMax,
          config.burstWindowMs /