import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError, AuthorizationError } from './advanced-error-handler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    did: string;
    role: 'user' | 'admin' | 'moderator';
  };
}

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    next();
  };
};

// Resource ownership check
export const requireOwnership = (resourceType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    const resourceId = req.params.id || req.params.userId;
    
    if (!resourceId) {
      throw new AppError('Resource ID required', 400);
    }

    try {
      let isOwner = false;

      switch (resourceType) {
        case 'user':
          isOwner = req.user.id === resourceId || req.user.walletAddress === resourceId;
          break;

        case 'trustScore':
          const trustScore = await prisma.trustScore.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          isOwner = trustScore?.userId === req.user.id;
          break;

        case 'linkedAccount':
          const linkedAccount = await prisma.linkedAccount.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          isOwner = linkedAccount?.userId === req.user.id;
          break;

        case 'notification':
          const notification = await prisma.notification.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          isOwner = notification?.userId === req.user.id;
          break;

        default:
          throw new AppError(`Unknown resource type: ${resourceType}`, 400);
      }

      if (!isOwner && req.user.role !== 'admin') {
        throw new AuthorizationError('Access denied to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// API key authorization
export const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new AuthorizationError('API key required');
  }

  try {
    const validKey = await prisma.apiKey.findUnique({
      where: { 
        key: apiKey,
        isActive: true,
      },
      include: {
        // Include any related data if needed
      },
    });

    if (!validKey) {
      throw new AuthorizationError('Invalid API key');
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: validKey.id },
      data: { lastUsed: new Date() },
    });

    // Attach API key info to request
    (req as any).apiKey = validKey;

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting based on user tier
export const tierBasedRateLimit = () => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    try {
      const userTier = await prisma.userTier.findUnique({
        where: { userId: req.user.id },
      });

      const tier = userTier?.tier || 'FREE';

      // Define rate limits per tier
      const rateLimits = {
        FREE: { requestsPerMinute: 60, requestsPerHour: 1000 },
        PREMIUM: { requestsPerMinute: 300, requestsPerHour: 10000 },
        ENTERPRISE: { requestsPerMinute: 1000, requestsPerHour: 100000 },
      };

      const limits = rateLimits[tier];

      // Implement rate limiting logic here
      // This would integrate with the cache service
      
      next();
    } catch (error) {
      // If rate limiting fails, allow the request
      console.error('Tier-based rate limiting error:', error);
      next();
    }
  };
};

// Permission-based middleware
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthorizationError('Authentication required');
    }

    // Define permissions for different roles
    const rolePermissions = {
      user: [
        'read:own_profile',
        'update:own_profile',
        'read:own_scores',
        'create:verification',
      ],
      moderator: [
        'read:any_profile',
        'read:any_scores',
        'update:verification',
        'read:audit_logs',
      ],
      admin: [
        'read:any_profile',
        'update:any_profile',
        'read:any_scores',
        'update:any_scores',
        'create:verification',
        'update:verification',
        'delete:verification',
        'read:audit_logs',
        'update:system_settings',
        'manage:users',
      ],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      throw new AuthorizationError(`Permission denied: ${permission}`);
    }

    next();
  };
};

// Two-factor authentication middleware
export const require2FA = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AuthorizationError('Authentication required');
  }

  // Check if 2FA is enabled for the user
  // This would check user preferences or a separate 2FA table
  
  const is2FARequired = false; // Implement 2FA check logic

  if (is2FARequired) {
    const twoFactorToken = req.headers['x-2fa-token'] as string;
    
    if (!twoFactorToken) {
      throw new AuthorizationError('Two-factor authentication required');
    }

    // Validate 2FA token
    const isValid2FAToken = await validate2FAToken(req.user.id, twoFactorToken);
    
    if (!isValid2FAToken) {
      throw new AuthorizationError('Invalid two-factor authentication token');
    }
  }

  next();
};

async function validate2FAToken(userId: string, token: string): Promise<boolean> {
  // Implement 2FA token validation
  // This could use TOTP, recovery codes, etc.
  return true; // Placeholder
}

// Session validation middleware
export const validateSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }

  try {
    // Check if user session is still valid
    // This could check against a sessions table or JWT expiry
    
    // For now, we'll just validate that the user still exists
    const userExists = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true },
    });

    if (!userExists) {
      throw new AuthorizationError('User account no longer exists');
    }

    next();
  } catch (error) {
    next(error);
  }
};