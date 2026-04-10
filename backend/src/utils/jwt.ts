import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '../types';

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'sves-api',
    audience: 'sves-client',
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'sves-api',
    audience: 'sves-client',
  }) as JWTPayload;
};

export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'sves-api',
    audience: 'sves-client',
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'sves-api',
    audience: 'sves-client',
  }) as JWTPayload;
};

export const decodeToken = (token: string): JWTPayload | null => {
  const decoded = jwt.decode(token);
  return decoded as JWTPayload | null;
};
