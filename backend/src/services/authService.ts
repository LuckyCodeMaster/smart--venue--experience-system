import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { UserPublic } from '../types';
import logger from '../utils/logger';

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const BLOCKLIST_PREFIX = 'token_blocklist:';

export const AuthService = {
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }): Promise<{ user: UserPublic; accessToken: string; refreshToken: string }> {
    const exists = await UserModel.existsByEmail(data.email);
    if (exists) {
      throw new Error('User with this email already exists');
    }

    const password_hash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await UserModel.create({
      email: data.email,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
    });

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    return { user, accessToken, refreshToken };
  },

  async login(
    email: string,
    password: string
  ): Promise<{ user: UserPublic; accessToken: string; refreshToken: string }> {
    const user = await UserModel.findByEmail(email);
    if (!user || !user.is_active) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    const { password_hash: _pw, ...publicUser } = user;
    return { user: publicUser, accessToken, refreshToken };
  },

  async logout(userId: string, token: string): Promise<void> {
    await Promise.all([
      redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`),
      redis.setex(`${BLOCKLIST_PREFIX}${token}`, 60 * 60, '1'),
    ]);
  },

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const stored = await redis.get(`${REFRESH_TOKEN_PREFIX}${payload.userId}`);
    if (stored !== refreshToken) {
      throw new Error('Refresh token has been revoked');
    }

    const user = await UserModel.findById(payload.userId);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    await redis.setex(
      `${REFRESH_TOKEN_PREFIX}${user.id}`,
      7 * 24 * 60 * 60,
      newRefreshToken
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async getMe(userId: string): Promise<UserPublic | null> {
    return UserModel.findById(userId);
  },

  async isTokenBlocked(token: string): Promise<boolean> {
    const result = await redis.get(`${BLOCKLIST_PREFIX}${token}`);
    return result === '1';
  },
};
