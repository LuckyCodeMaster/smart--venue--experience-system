import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

const createRedisClient = (): Redis => {
  // Use the URL API to check whether the Redis URL includes a password,
  // rather than a string search that could produce false positives.
  const urlHasPassword = (() => {
    try {
      return !!new URL(env.REDIS_URL).password;
    } catch {
      return false;
    }
  })();

  const client = new Redis(env.REDIS_URL, {
    ...(urlHasPassword ? {} : { password: env.REDIS_PASSWORD }),
    db: env.REDIS_DB,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy: (times: number): number | null => {
      if (times > 10) {
        logger.error('Redis: max retry attempts reached');
        return null;
      }
      return Math.min(times * 200, 3000);
    },
  });

  client.on('connect', () => {
    logger.info('Redis: connected');
  });

  client.on('ready', () => {
    logger.info('Redis: ready');
  });

  client.on('error', (err: Error) => {
    logger.error('Redis error:', err.message);
  });

  client.on('close', () => {
    logger.warn('Redis: connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis: reconnecting...');
  });

  return client;
};

export const redis = createRedisClient();

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
};

export default redis;
