import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const requireRole = (roles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user role from database
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { 
          role: true,
          userTier: {
            select: { tier: true }
          }
        },
      });

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userRoles = [userData.role, userData.userTier?.tier].filter(Boolean);
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => 
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Required roles: ${requiredRoles.join(', ')}`,
          userRoles
        });
      }

      // Add user roles to request for downstream use
      (req as any).userRoles = userRoles;
      
      next();
    } catch (error) {
      console.error('Role authentication error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const requireAdmin = requireRole('admin');
export const requirePremium = requireRole(['PREMIUM', 'ENTERPRISE', 'admin']);
export const requireEnterprise = requireRole(['ENTERPRISE', 'admin']);

// API key authentication middleware
export const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Validate API key
    const validKey = await prisma.apiKey.findFirst({
      where: { 
        key: apiKey,
        isActive: true 
      },
      include: {
        organization: true,
      },
    });

    if (!validKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: validKey.id },
      data: { lastUsed: new Date() },
    });

    // Add API key info to request
    (req as any).apiKey = {
      id: validKey.id,
      organization: validKey.organization,
      rateLimit: validKey.rateLimit,
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Combined authentication (JWT or API key)
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT authentication
    return requireJwtAuth(req, res, next);
  } else if (apiKey) {
    // API key authentication
    return requireApiKey(req, res, next);
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
};

// JWT authentication middleware
const requireJwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const { verifyJWT } = await import('../lib/auth');
    const decoded = verifyJWT(token);
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true,
        walletAddress: true,
        did: true,
        email: true,
        role: true,
        userTier: {
          select: { tier: true }
        }
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    (req as any).user = {
      ...user,
      tier: user.userTier?.tier || 'FREE'
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};