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
import { notificationsRouter } from './routes/notifications';
import { analyticsRouter } from './routes/analytics';
import { preferencesRouter } from './routes/preferences';
import { advancedErrorHandler, asyncHandler } from './middleware/advanced-error-handler';
import { requestLogger } from './middleware/request-logger';
import { advancedSecurityHeaders, createAdvancedRateLimit, securityRequestLogger } from './middleware/advanced-security';
import { performanceMiddleware, performanceMonitor } from './middleware/performance';
import { setupSwagger } from './docs/swagger';
import { WebSocketService } from './services/websocket-service';
import { cacheService } from './services/cache-service';
import { logger } from './services/logger-service';

export class EnhancedTrustIQServer {
  public app: express.Application;
  public prisma: PrismaClient;
  public wsService?: WebSocketService;

  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeMonitoring();
  }

  private initializeServices() {
    // Initialize cache service
    cacheService.get('health').catch(() => {
      logger.warn('Cache service not available');
    });

    // Start performance monitoring
    performanceMonitor.startMonitoring();
  }

  private initializeMiddleware(): void {
    // Advanced security headers
    this.app.use(advancedSecurityHeaders);
    
    // Advanced rate limiting
    const rateLimiters = createAdvancedRateLimit();
    this.app.use(rateLimiters.general);
    this.app.use('/api/v1/auth', rateLimiters.auth);
    this.app.use('/api/v1/verification', rateLimiters.apiKey);

    // CORS configuration
    this.app.use(cors({
      origin: env.NODE_ENV === 'production' 
        ? ['https://trustiq.xyz', 'https://app.trustiq.xyz'] 
        : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    }));

    // Body parsing with limits
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Security logging
    this.app.use(securityRequestLogger);

    // Performance monitoring
    this.app.use(performanceMiddleware);

    // Health check endpoint
    this.app.get('/health', asyncHandler(async (req, res) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        memory: process.memoryUsage(),
        database: await this.checkDatabaseHealth(),
        cache: await this.checkCacheHealth(),
        version: process.env.npm_package_version || '1.0.0',
      };

      res.status(200).json(health);
    }));

    // Ready check endpoint for load balancers
    this.app.get('/ready', asyncHandler(async (req, res) => {
      const dbHealthy = await this.checkDatabaseHealth();
      const cacheHealthy = await this.checkCacheHealth();

      if (dbHealthy && cacheHealthy) {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ 
          status: 'not ready',
          database: dbHealthy,
          cache: cacheHealthy,
        });
      }
    }));
  }

  private initializeRoutes(): void {
    // API routes with versioning
    this.app.use('/api/v1/auth', authRouter);
    this.app.use('/api/v1/users', userRouter);
    this.app.use('/api/v1/verification', verificationRouter);
    this.app.use('/api/v1/trust-score', trustScoreRouter);
    this.app.use('/api/v1/blockchain', blockchainRouter);
    this.app.use('/api/v1/notifications', notificationsRouter);
    this.app.use('/api/v1/analytics', analyticsRouter);
    this.app.use('/api/v1/preferences', preferencesRouter);

    // API documentation
    if (env.NODE_ENV !== 'production') {
      setupSwagger(this.app);
    }

    // Catch-all for undefined routes
    this.app.all('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.path}`,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(advancedErrorHandler);
  }

  private initializeMonitoring(): void {
    // Log startup information
    logger.info('TrustIQ server starting', {
      environment: env.NODE_ENV,
      port: env.API_PORT,
      nodeVersion: process.version,
    });

    // Graceful shutdown handling
    this.setupGracefulShutdown();
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      return false;
    }
  }

  private async checkCacheHealth(): Promise<boolean> {
    try {
      await cacheService.set('health_check', 'ok', 10);
      const value = await cacheService.get('health_check');
      return value === 'ok';
    } catch (error) {
      logger.error('Cache health check failed', error as Error);
      return false;
    }
  }

  private setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown`);
        
        // Close WebSocket connections
        if (this.wsService) {
          // WebSocket service would have a method to close all connections
        }
        
        // Close database connection
        await this.prisma.$disconnect();
        
        // Close cache connection
        await cacheService.disconnect();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });
    });
  }

  public async start(port: number = 3001): Promise<void> {
    try {
      // Test database connection
      await this.prisma.$connect();
      logger.info('Database connected successfully');

      // Start server
      const server = this.app.listen(port, () => {
        logger.info(`TrustIQ API server running on port ${port}`, {
          environment: env.NODE_ENV,
          port,
        });
      });

      // Initialize WebSocket service
      this.wsService = new WebSocketService(server);
      logger.info('WebSocket service initialized');

    } catch (error) {
      logger.error('Failed to start server', error as Error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
    await cacheService.disconnect();
    logger.info('Server shut down gracefully');
  }
}