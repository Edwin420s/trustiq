import { Request, Response, NextFunction } from 'express';
import { env } from '@trustiq/shared-config';
import { logger } from '../services/logger-service';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400);
    this.details = details;
  }

  public details?: any;
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

export const advancedErrorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred', error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  });

  // Handle different error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      ...(error instanceof ValidationError && { details: error.details }),
      ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
    });
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.message,
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }

  // Handle database errors
  if (error.name === 'MongoError' || error.name === 'PrismaClientKnownRequestError') {
    // Don't expose database errors in production
    const message = env.NODE_ENV === 'production' 
      ? 'Database error occurred' 
      : error.message;

    return res.status(500).json({
      error: message,
    });
  }

  // Default error
  const statusCode = (error as any).statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : error.message;

  res.status(statusCode).json({
    error: message,
    ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global unhandled rejection handler
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', reason, {
    promise: promise.toString(),
  });
  
  // In production, you might want to exit the process
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Global uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', error);
  
  // In production, you might want to exit the process
  if (env.NODE_ENV === 'production') {
    process.exit(1);
  }
});