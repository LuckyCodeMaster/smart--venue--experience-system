import { QueueModel } from '../models/Queue';
import { Queue, QueueEntry, PaginationParams } from '../types';
import { CacheService } from './cacheService';
import { WebSocketService } from './websocketService';
import logger from '../utils/logger';

const CACHE_TTL = 30;

export const QueueService = {
  async listQueues(
    params: PaginationParams,
    venueId?: string
  ): Promise<{ data: Queue[]; total: number }> {
    const cacheKey = `queues:${venueId ?? 'all'}:${params.page}:${params.limit}`;
    const cached = await CacheService.get<{ data: Queue[]; total: number }>(cacheKey);
    if (cached) return cached;

    let data: Queue[];
    if (venueId) {
      data = await QueueModel.findByVenueId(venueId);
    } else {
      data = await QueueModel.findAll();
    }

    const sliced = data.slice(params.offset, params.offset + params.limit);
    const result = { data: sliced, total: data.length };

    await CacheService.set(cacheKey, result, CACHE_TTL);
    return result;
  },

  async getQueueById(id: string): Promise<Queue | null> {
    const cacheKey = `queue:${id}`;
    const cached = await CacheService.get<Queue>(cacheKey);
    if (cached) return cached;

    const queue = await QueueModel.findById(id);
    if (queue) await CacheService.set(cacheKey, queue, CACHE_TTL);
    return queue;
  },

  async createQueue(data: {
    venue_id: string;
    name: string;
    description?: string | null;
    max_capacity?: number | null;
  }): Promise<Queue> {
    const queue = await QueueModel.create(data);
    await CacheService.invalidatePattern(`queues:${data.venue_id}*`);
    return queue;
  },

  async updateQueue(id: string, data: Partial<Queue>): Promise<Queue | null> {
    const queue = await QueueModel.update(id, data);
    if (queue) {
      await CacheService.del(`queue:${id}`);
      await CacheService.invalidatePattern(`queues:${queue.venue_id}*`);

      WebSocketService.broadcastToVenue(queue.venue_id, {
        type: 'queue:updated',
        payload: {
          queueId: queue.id,
          venueId: queue.venue_id,
          status: queue.status,
          avgWaitMinutes: queue.avg_wait_time_minutes,
          currentLength: queue.current_position,
        },
        timestamp: new Date().toISOString(),
        venueId: queue.venue_id,
      });
    }
    return queue;
  },

  async deleteQueue(id: string): Promise<boolean> {
    const queue = await QueueModel.findById(id);
    if (!queue) return false;
    const deleted = await QueueModel.delete(id);
    if (deleted) {
      await CacheService.del(`queue:${id}`);
      await CacheService.invalidatePattern(`queues:${queue.venue_id}*`);
    }
    return deleted;
  },

  async joinQueue(
    queueId: string,
    userId: string,
    partySize = 1,
    notes?: string
  ): Promise<QueueEntry | { error: string }> {
    const queue = await QueueModel.findById(queueId);
    if (!queue) return { error: 'Queue not found' };
    if (queue.status !== 'active') return { error: `Queue is ${queue.status}` };

    const existing = await QueueModel.findEntryByUserAndQueue(userId, queueId);
    if (existing) return { error: 'You are already in this queue' };

    if (queue.max_capacity) {
      const waiting = await QueueModel.getWaitingEntries(queueId);
      if (waiting.length >= queue.max_capacity) {
        return { error: 'Queue is at maximum capacity' };
      }
    }

    const entry = await QueueModel.addEntry({
      queue_id: queueId,
      user_id: userId,
      party_size: partySize,
      notes,
    });

    const waitingEntries = await QueueModel.getWaitingEntries(queueId);
    const estimatedWait = queue.avg_wait_time_minutes * (entry.position - 1);
    entry.estimated_wait_minutes = estimatedWait;

    await CacheService.del(`queue:${queueId}`);

    WebSocketService.broadcastToVenue(queue.venue_id, {
      type: 'queue:entry:joined',
      payload: {
        queueId,
        venueId: queue.venue_id,
        currentLength: waitingEntries.length,
        avgWaitMinutes: queue.avg_wait_time_minutes,
        status: queue.status,
      },
      timestamp: new Date().toISOString(),
      venueId: queue.venue_id,
    });

    return entry;
  },

  async leaveQueue(queueId: string, userId: string): Promise<QueueEntry | null> {
    const entry = await QueueModel.findEntryByUserAndQueue(userId, queueId);
    if (!entry) return null;

    const updated = await QueueModel.updateEntryStatus(entry.id, 'cancelled');

    const queue = await QueueModel.findById(queueId);
    if (queue) {
      await CacheService.del(`queue:${queueId}`);
      WebSocketService.broadcastToVenue(queue.venue_id, {
        type: 'queue:updated',
        payload: {
          queueId,
          venueId: queue.venue_id,
          status: queue.status,
          avgWaitMinutes: queue.avg_wait_time_minutes,
          currentLength: queue.current_position - 1,
        },
        timestamp: new Date().toISOString(),
        venueId: queue.venue_id,
      });
    }

    return updated;
  },

  async getQueueStatus(queueId: string): Promise<{
    queue: Queue;
    waitingCount: number;
    estimatedWaitMinutes: number;
    entries: QueueEntry[];
  } | null> {
    const status = await QueueModel.getStatus(queueId);
    if (!status) return null;

    return {
      ...status,
      estimatedWaitMinutes:
        status.queue.avg_wait_time_minutes * status.waitingCount,
    };
  },

  async callNextEntry(queueId: string): Promise<QueueEntry | null> {
    const entries = await QueueModel.getWaitingEntries(queueId);
    if (entries.length === 0) return null;

    const next = entries[0]!;
    const updated = await QueueModel.updateEntryStatus(next.id, 'called');

    const queue = await QueueModel.findById(queueId);
    if (queue && updated) {
      WebSocketService.broadcastToVenue(queue.venue_id, {
        type: 'queue:entry:called',
        payload: { entryId: next.id, queueId, venueId: queue.venue_id, userId: next.user_id },
        timestamp: new Date().toISOString(),
        venueId: queue.venue_id,
      });

      try {
        await QueueModel.recalcAvgWaitTime(queueId);
      } catch (err) {
        logger.error('Failed to recalculate avg wait time:', err);
      }
    }

    return updated;
  },

  calculateEstimatedWait(position: number, avgWaitMinutes: number): number {
    return Math.max(0, (position - 1) * avgWaitMinutes);
  },
};
