import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { QueueService } from '../services/queueService';
import { success, created, noContent, error, paginated, getPaginationParams } from '../utils/apiResponse';
import logger from '../utils/logger';

export const queueController = {
  async getQueues(req: Request, res: Response): Promise<void> {
    try {
      const { venue_id } = req.query as { venue_id?: string };
      const params = getPaginationParams(req.query as Record<string, unknown>);
      const { data, total } = await QueueService.listQueues(params, venue_id);
      paginated(res, data, total, params);
    } catch (err) {
      logger.error('GetQueues error:', err);
      error(res, 'Failed to fetch queues', 500);
    }
  },

  async getQueue(req: Request, res: Response): Promise<void> {
    try {
      const queue = await QueueService.getQueueById(req.params['id']!);
      if (!queue) {
        error(res, 'Queue not found', 404);
        return;
      }
      success(res, queue);
    } catch (err) {
      logger.error('GetQueue error:', err);
      error(res, 'Failed to fetch queue', 500);
    }
  },

  async createQueue(req: Request, res: Response): Promise<void> {
    try {
      const queue = await QueueService.createQueue(req.body as {
        venue_id: string;
        name: string;
        description?: string;
        max_capacity?: number;
      });
      created(res, queue, 'Queue created successfully');
    } catch (err) {
      logger.error('CreateQueue error:', err);
      error(res, 'Failed to create queue', 500);
    }
  },

  async updateQueue(req: Request, res: Response): Promise<void> {
    try {
      const queue = await QueueService.updateQueue(req.params['id']!, req.body as Record<string, unknown>);
      if (!queue) {
        error(res, 'Queue not found', 404);
        return;
      }
      success(res, queue, 'Queue updated successfully');
    } catch (err) {
      logger.error('UpdateQueue error:', err);
      error(res, 'Failed to update queue', 500);
    }
  },

  async deleteQueue(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await QueueService.deleteQueue(req.params['id']!);
      if (!deleted) {
        error(res, 'Queue not found', 404);
        return;
      }
      noContent(res);
    } catch (err) {
      logger.error('DeleteQueue error:', err);
      error(res, 'Failed to delete queue', 500);
    }
  },

  async joinQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        error(res, 'Authentication required', 401);
        return;
      }
      const { party_size, notes } = req.body as { party_size?: number; notes?: string };
      const result = await QueueService.joinQueue(
        req.params['id']!,
        req.user.userId,
        party_size,
        notes
      );
      if ('error' in result) {
        error(res, result.error, 400);
        return;
      }
      created(res, result, 'Joined queue successfully');
    } catch (err) {
      logger.error('JoinQueue error:', err);
      error(res, 'Failed to join queue', 500);
    }
  },

  async leaveQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        error(res, 'Authentication required', 401);
        return;
      }
      const result = await QueueService.leaveQueue(req.params['id']!, req.user.userId);
      if (!result) {
        error(res, 'Queue entry not found', 404);
        return;
      }
      success(res, null, 'Left queue successfully');
    } catch (err) {
      logger.error('LeaveQueue error:', err);
      error(res, 'Failed to leave queue', 500);
    }
  },

  async getQueueStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await QueueService.getQueueStatus(req.params['id']!);
      if (!status) {
        error(res, 'Queue not found', 404);
        return;
      }
      success(res, status);
    } catch (err) {
      logger.error('GetQueueStatus error:', err);
      error(res, 'Failed to get queue status', 500);
    }
  },

  async callNextEntry(req: Request, res: Response): Promise<void> {
    try {
      const entry = await QueueService.callNextEntry(req.params['id']!);
      if (!entry) {
        error(res, 'No waiting entries in queue', 404);
        return;
      }
      success(res, entry, 'Next entry called');
    } catch (err) {
      logger.error('CallNextEntry error:', err);
      error(res, 'Failed to call next entry', 500);
    }
  },
};
