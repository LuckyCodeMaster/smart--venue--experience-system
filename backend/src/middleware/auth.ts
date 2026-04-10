import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { error } from '../utils/apiResponse';
import { JWTPayload, UserRole } from '../types';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    error(res, 'Authentication required', 401);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    if (message.includes('expired')) {
      error(res, 'Token expired', 401, 'TOKEN_EXPIRED');
      return;
    }
    error(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
};

export const authorize = (...roles: UserRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      error(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.userId} with role ${req.user.role}`);
      error(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyToken(token);
  } catch {
    // silently ignore invalid optional token
  }
  next();
};
