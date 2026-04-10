import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import logger from '../utils/logger';
import { env } from '../config/env';

export const createError = (
  message: string,
  statusCode: number,
  isOperational = true
): AppError => {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.isOperational = isOperational;
  return err;
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const err = createError(`Cannot ${req.method} ${req.path}`, 404);
  next(err);
};

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const appError = err as AppError;
  const statusCode = appError.statusCode ?? 500;
  const isOperational = appError.isOperational ?? false;

  if (!isOperational || statusCode === 500) {
    logger.error('Unhandled error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  const message = isOperational ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    error: env.isDevelopment() ? err.message : undefined,
    stack: env.isDevelopment() ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
};
