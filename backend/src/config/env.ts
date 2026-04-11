import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, defaultValue: string): string =>
  process.env[key] ?? defaultValue;

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),

  DATABASE_URL: process.env['DATABASE_URL'],
  // Accept PG_* (docker-compose convention) with DB_* as fallback
  DB_HOST: process.env['PG_HOST'] ?? process.env['DB_HOST'] ?? 'localhost',
  DB_PORT: parseInt(process.env['PG_PORT'] ?? process.env['DB_PORT'] ?? '5432', 10),
  DB_NAME: process.env['PG_DATABASE'] ?? process.env['DB_NAME'] ?? 'sves_db',
  DB_USER: process.env['PG_USER'] ?? process.env['DB_USER'] ?? 'postgres',
  DB_PASSWORD: process.env['PG_PASSWORD'] ?? process.env['DB_PASSWORD'] ?? '',
  DB_POOL_MIN: parseInt(optional('DB_POOL_MIN', '2'), 10),
  DB_POOL_MAX: parseInt(optional('DB_POOL_MAX', '10'), 10),

  REDIS_URL: optional('REDIS_URL', 'redis://localhost:6379'),
  REDIS_PASSWORD: process.env['REDIS_PASSWORD'],
  REDIS_DB: parseInt(optional('REDIS_DB', '0'), 10),

  JWT_SECRET: optional('JWT_SECRET', 'change-this-secret-in-production'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET: optional('JWT_REFRESH_SECRET', 'change-this-refresh-secret-in-production'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  BCRYPT_ROUNDS: parseInt(optional('BCRYPT_ROUNDS', '12'), 10),

  RATE_LIMIT_WINDOW_MS: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),

  CORS_ORIGINS: optional('CORS_ORIGINS', 'http://localhost:3000').split(','),

  LOG_LEVEL: optional('LOG_LEVEL', 'info'),
  LOG_DIR: optional('LOG_DIR', 'logs'),

  SENSOR_API_KEY_SALT: optional('SENSOR_API_KEY_SALT', 'sensor-api-key-salt'),

  isProduction: (): boolean => process.env['NODE_ENV'] === 'production',
  isDevelopment: (): boolean => process.env['NODE_ENV'] === 'development',
  isTest: (): boolean => process.env['NODE_ENV'] === 'test',
};

export const validateEnv = (): void => {
  if (env.isProduction()) {
    required('JWT_SECRET');
    required('JWT_REFRESH_SECRET');
    required('DATABASE_URL');
  }
};
