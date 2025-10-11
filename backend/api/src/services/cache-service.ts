import Redis from 'ioredis';
import { env } from '@trustiq/shared-config';

export class CacheService {
  private redis: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  constructor() {
    this.redis = new Redis(env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, by);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      return await this.redis.decrby(key, by);
    } catch (error) {
      console.error('Cache decrement error:', error);
      return 0;
    }
  }

  async getWithFallback<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, execute fallback
      const result = await fallback();
      
      // Store in cache for future requests
      await this.set(key, result, ttl);
      
      return result;
    } catch (error) {
      console.error('Cache getWithFallback error:', error);
      // If cache fails, still try the fallback
      return fallback();
    }
  }

  // User-specific caching
  async getUserTrustScore(userId: string): Promise<number | null> {
    const key = `user:${userId}:trust_score`;
    return this.get(key);
  }

  async setUserTrustScore(userId: string, score: number, ttl: number = 1800): Promise<void> {
    const key = `user:${userId}:trust_score`;
    await this.set(key, score, ttl);
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `user:${userId}:*`;
    await this.deletePattern(pattern);
  }

  // Platform-specific caching
  async getPlatformStats(platform: string): Promise<any> {
    const key = `platform:${platform}:stats`;
    return this.get(key);
  }

  async setPlatformStats(platform: string, stats: any, ttl: number = 3600): Promise<void> {
    const key = `platform:${platform}:stats`;
    await this.set(key, stats, ttl);
  }

  // Analytics caching
  async getAnalytics(key: string): Promise<any> {
    const cacheKey = `analytics:${key}`;
    return this.get(cacheKey);
  }

  async setAnalytics(key: string, data: any, ttl: number = 900): Promise<void> {
    const cacheKey = `analytics:${key}`;
    await this.set(cacheKey, data, ttl);
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const windowStart = now - window * 1000;
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    const currentCount = await this.redis.zcard(key);
    
    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil((Number(await this.redis.zrange(key, 0, 0)[0]) + window * 1000) / 1000),
      };
    }
    
    // Add current request
    await this.redis.zadd(key, now.toString(), now.toString());
    await this.redis.expire(key, window);
    
    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      reset: Math.ceil((now + window * 1000) / 1000),
    };
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

export const cacheService = new CacheService();