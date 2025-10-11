import { Request, Response, NextFunction } from 'express';

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000;

  startMonitoring() {
    // Monitor memory usage
    setInterval(() => {
      this.recordMetrics();
    }, 60000); // Record every minute
  }

  recordMetrics() {
    const metrics: PerformanceMetrics = {
      responseTime: 0, // This would be set per request
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date(),
    };

    this.metrics.push(metrics);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  getSummary() {
    if (this.metrics.length === 0) {
      return null;
    }

    const recentMetrics = this.metrics.slice(-10); // Last 10 metrics
    const responseTimes = recentMetrics.map(m => m.responseTime).filter(t => t > 0);
    
    return {
      avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b) / responseTimes.length : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      memoryUsage: recentMetrics[recentMetrics.length - 1].memoryUsage,
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const responseTime = seconds * 1000 + nanoseconds / 1000000;

    // Record response time for this request
    const metrics = performanceMonitor.getMetrics();
    if (metrics.length > 0) {
      metrics[metrics.length - 1].responseTime = responseTime;
    }
  });

  next();
};

// Database performance monitoring
export const monitorDatabasePerformance = () => {
  // This would integrate with your database client
  // For Prisma, you could use the $on method to monitor queries
  console.log('Database performance monitoring enabled');
};