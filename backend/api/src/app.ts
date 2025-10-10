import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { env } from '@trustiq/shared-config';

import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { verificationRouter } from './routes/verification';
import { trustScoreRouter } from './routes/trust-score';
import { blockchainRouter } from './routes/blockchain';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { securityHeaders } from './middleware/security';

export class TrustIQServer {
  public app: express.Application;
  public prisma: PrismaClient;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(securityHeaders);
    this.app.use(helmet());
    
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        error: 'Too many requests',
        message: 'You have exceeded the 100 requests in 15 minutes limit.',
      },
    }));

    this.app.use(cors({
      origin: env.NODE_ENV === 'production' 
        ? ['https://trustiq.xyz'] 
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    this.app.use('/api/v1/auth', authRouter);
    this.app.use('/api/v1/users', userRouter);
    this.app.use('/api/v1/verification', verificationRouter);
    this.app.use('/api/v1/trust-score', trustScoreRouter);
    this.app.use('/api/v1/blockchain', blockchainRouter);

    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(port: number = 3001): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('Database connected successfully');

      this.app.listen(port, () => {
        console.log(`TrustIQ API server running on port ${port}`);
        console.log(`Environment: ${env.NODE_ENV}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
    console.log('Server shut down gracefully');
  }
}