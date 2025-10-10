import { Request, Response, NextFunction } from 'express';
import { env } from '@trustiq/shared-config';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  if (env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}