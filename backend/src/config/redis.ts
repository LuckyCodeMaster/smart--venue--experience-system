import Redis from 'ioredis';
import { env } from './env';
import logger from '../utils/logger';

const createRedisClient = (): Redis => {
  // If the URL already contains credentials (any redis://...@... form), do not pass
  // the password option separately – ioredis would override the URL password
  // with the option value, potentially causing authentication failures.
  const urlHasPassword = env.REDIS_URL.includes('@');

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
