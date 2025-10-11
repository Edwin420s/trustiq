import { createLogger, format, transports } from 'winston';
import { env } from '@trustiq/shared-config';

export class LoggerService {
  private logger;

  constructor() {
    this.logger = createLogger({
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service: 'trustiq-api' },
      transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new transports.File({ filename: 'logs/combined.log' }),
      ],
    });

    // If we're not in production, log to the console as well
    if (env.NODE_ENV !== 'production') {
      this.logger.add(new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        ),
      }));
    }
  }

  log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { ...meta, error: error?.message, stack: error?.stack });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  // Structured logging for specific events
  logAuthEvent(userId: string, event: string, meta?: any) {
    this.info(`Auth event: ${event}`, { userId, event, ...meta });
  }

  logTrustScoreEvent(userId: string, oldScore: number, newScore: number, meta?: any) {
    this.info('Trust score updated', { 
      userId, 
      oldScore, 
      newScore, 
      change: newScore - oldScore,
      ...meta 
    });
  }

  logBlockchainEvent(transactionHash: string, event: string, meta?: any) {
    this.info(`Blockchain event: ${event}`, { transactionHash, event, ...meta });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', meta?: any) {
    this.warn(`Security event: ${event}`, { event, severity, ...meta });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, meta?: any) {
    this.debug(`Performance: ${operation}`, { operation, duration, ...meta });
  }

  // Business metrics logging
  logBusinessMetric(metric: string, value: number, meta?: any) {
    this.info(`Business metric: ${metric}`, { metric, value, ...meta });
  }
}

export const logger = new LoggerService();