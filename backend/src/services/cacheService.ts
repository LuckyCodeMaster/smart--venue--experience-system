import { redis } from '../config/redis';
import logger from '../utils/logger';

const DEFAULT_TTL = 300;

export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      logger.error(`Cache get error for key ${key}:`, err);
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.error(`Cache set error for key ${key}:`, err);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      logger.error(`Cache del error for key ${key}:`, err);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.error(`Cache invalidate pattern error for ${pattern}:`, err);
    }
  },

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds = DEFAULT_TTL
  ): Promise<T> {
    const cached = await CacheService.get<T>(key);
    if (cached !== null) return cached;

    const value = await fn();
    await CacheService.set(key, value, ttlSeconds);
    return value;
  },

  async increment(key: string, ttlSeconds = DEFAULT_TTL): Promise<number> {
    try {
      const value = await redis.incr(key);
      if (value === 1) {
        await redis.expire(key, ttlSeconds);
      }
      return value;
    } catch (err) {
      logger.error(`Cache increment error for key ${key}:`, err);
      return 0;
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1;
    } catch {
      return false;
    }
  },
};
