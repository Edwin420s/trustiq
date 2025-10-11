import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from '@trustiq/shared-config';

// Advanced rate limiting with different strategies
export const createAdvancedRateLimit = () => {
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'You have exceeded the 100 requests in 15 minutes limit.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes.',
    },
    skipSuccessfulRequests: true,
  });

  const apiKeyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // limit each API key to 60 requests per minute
    keyGenerator: (req) => {
      return req.headers['x-api-key'] as string || req.ip;
    },
    message: {
      error: 'API rate limit exceeded',
      message: 'You have exceeded the API rate limit.',
    },
  });

  return {
    general: generalLimiter,
    auth: authLimiter,
    apiKey: apiKeyLimiter,
  };
};

// Advanced security headers
export const advancedSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.trustiq.xyz", "wss:", "https://*.sui.io"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

function sanitizeObject(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Basic XSS prevention
      obj[key] = obj[key]
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// API key validation middleware
export const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    // In production, validate against database
    const isValid = await validateApiKeyAgainstDatabase(apiKey);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await updateApiKeyUsage(apiKey);

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function validateApiKeyAgainstDatabase(apiKey: string): Promise<boolean> {
  // Implementation would query the database
  // This is a simplified version
  return apiKey.startsWith('trustiq_');
}

async function updateApiKeyUsage(apiKey: string): Promise<void> {
  // Implementation would update the database
  // This is a placeholder
}

// Request logging with security context
export const securityRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const securityContext = {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl,
    apiKey: req.headers['x-api-key'] ? 'present' : 'missing',
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      ...securityContext,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    };

    // Log security events
    if (res.statusCode >= 400) {
      console.warn('Security event:', logData);
    } else {
      console.log('Request:', logData);
    }
  });

  next();
};