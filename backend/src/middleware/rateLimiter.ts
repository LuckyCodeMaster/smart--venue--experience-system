import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { error } from '../utils/apiResponse';

export const defaultLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    error(res, 'Too many requests, please try again later', 429);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    error(res, 'Too many authentication attempts, please try again later', 429);
  },
});

export const sensorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-sensor-api-key'] as string ?? req.ip ?? 'unknown',
  handler: (_req, res) => {
    error(res, 'Sensor rate limit exceeded', 429);
  },
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    error(res, 'Too many requests', 429);
  },
});
