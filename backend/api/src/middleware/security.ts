import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number) => 
  rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message: `You have exceeded the ${max} requests in ${windowMs / 1000 / 60} minutes limit.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

// CORS configuration
export const corsOptions = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://trustiq.xyz',
      'https://app.trustiq.xyz',
      'http://localhost:3000',
      'http://localhost:5173',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.trustiq.xyz", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Input validation middleware
export const validateInput = (schema: any) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };