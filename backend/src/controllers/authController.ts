import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { success, created, error } from '../utils/apiResponse';
import logger from '../utils/logger';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name, role } = req.body as {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        role?: string;
      };

      const result = await AuthService.register({ email, password, first_name, last_name, role });
      created(res, result, 'User registered successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('already exists')) {
        error(res, message, 409);
      } else {
        logger.error('Register error:', err);
        error(res, 'Registration failed', 500);
      }
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await AuthService.login(email, password);
      success(res, result, 'Login successful');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message.includes('Invalid credentials')) {
        error(res, 'Invalid email or password', 401);
      } else {
        logger.error('Login error:', err);
        error(res, 'Login failed', 500);
      }
    }
  },

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader?.slice(7);
      if (token && req.user) {
        await AuthService.logout(req.user.userId, token);
      }
      success(res, null, 'Logged out successfully');
    } catch (err) {
      logger.error('Logout error:', err);
      error(res, 'Logout failed', 500);
    }
  },

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body as { refresh_token: string };
      const result = await AuthService.refreshToken(refresh_token);
      success(res, result, 'Token refreshed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token refresh failed';
      error(res, message, 401);
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        error(res, 'Not authenticated', 401);
        return;
      }
      const user = await AuthService.getMe(req.user.userId);
      if (!user) {
        error(res, 'User not found', 404);
        return;
      }
      success(res, user);
    } catch (err) {
      logger.error('GetMe error:', err);
      error(res, 'Failed to get user', 500);
    }
  },
};
