import http from 'http';
import createApp from './app';
import { env, validateEnv } from './config/env';
import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import { WebSocketService } from './services/websocketService';
import logger from './utils/logger';

const start = async (): Promise<void> => {
  validateEnv();

  try {
    await testConnection();
    logger.info('Database: connected');
  } catch (err) {
    logger.error('Database connection failed:', err);
    process.exit(1);
  }

  try {
    await connectRedis();
    logger.info('Redis: connected');
  } catch (err) {
    logger.warn('Redis connection failed, continuing without cache:', err);
  }

  const app = createApp();
  const server = http.createServer(app);

  WebSocketService.initialize(server);
  logger.info('WebSocket server initialized');

  server.listen(env.PORT, () => {
    logger.info(`SVES API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
