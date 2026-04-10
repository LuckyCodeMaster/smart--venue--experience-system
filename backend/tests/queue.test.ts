import { QueueService } from '../src/services/queueService';
import { QueueModel } from '../src/models/Queue';
import { CacheService } from '../src/services/cacheService';
import { WebSocketService } from '../src/services/websocketService';
import { Queue, QueueEntry } from '../src/types';

jest.mock('../src/models/Queue');
jest.mock('../src/services/cacheService');
jest.mock('../src/services/websocketService');

const mockQueueModel = QueueModel as jest.Mocked<typeof QueueModel>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;
const mockWsService = WebSocketService as jest.Mocked<typeof WebSocketService>;

const mockQueue: Queue = {
  id: 'queue-uuid',
  venue_id: 'venue-uuid',
  name: 'Main Queue',
  description: null,
  status: 'active',
  max_capacity: 50,
  avg_wait_time_minutes: 10,
  current_position: 5,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockEntry: QueueEntry = {
  id: 'entry-uuid',
  queue_id: 'queue-uuid',
  user_id: 'user-uuid',
  position: 6,
  status: 'waiting',
  party_size: 1,
  notes: null,
  joined_at: new Date(),
  called_at: null,
  served_at: null,
  cancelled_at: null,
  estimated_wait_minutes: null,
};

describe('QueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
    mockCacheService.del.mockResolvedValue(undefined);
    mockCacheService.invalidatePattern.mockResolvedValue(undefined);
    mockWsService.broadcastToVenue.mockImplementation(() => undefined);
  });

  describe('calculateEstimatedWait', () => {
    it('should return 0 for position 1', () => {
      expect(QueueService.calculateEstimatedWait(1, 10)).toBe(0);
    });

    it('should calculate wait correctly for position 3 with 10 min avg', () => {
      expect(QueueService.calculateEstimatedWait(3, 10)).toBe(20);
    });

    it('should never return negative wait time', () => {
      expect(QueueService.calculateEstimatedWait(0, 10)).toBe(0);
    });
  });

  describe('joinQueue', () => {
    it('should add user to queue successfully', async () => {
      mockQueueModel.findById.mockResolvedValue(mockQueue);
      mockQueueModel.findEntryByUserAndQueue.mockResolvedValue(null);
      mockQueueModel.getWaitingEntries.mockResolvedValue([]);
      mockQueueModel.addEntry.mockResolvedValue({ ...mockEntry, position: 1 });

      const result = await QueueService.joinQueue('queue-uuid', 'user-uuid', 2);

      expect(result).not.toHaveProperty('error');
      expect(mockQueueModel.addEntry).toHaveBeenCalledWith({
        queue_id: 'queue-uuid',
        user_id: 'user-uuid',
        party_size: 2,
        notes: undefined,
      });
    });

    it('should reject joining a paused queue', async () => {
      mockQueueModel.findById.mockResolvedValue({ ...mockQueue, status: 'paused' });

      const result = await QueueService.joinQueue('queue-uuid', 'user-uuid');

      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('paused');
    });

    it('should reject joining a queue the user is already in', async () => {
      mockQueueModel.findById.mockResolvedValue(mockQueue);
      mockQueueModel.findEntryByUserAndQueue.mockResolvedValue(mockEntry);

      const result = await QueueService.joinQueue('queue-uuid', 'user-uuid');

      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('already in this queue');
    });

    it('should reject when queue is at max capacity', async () => {
      const fullQueue = { ...mockQueue, max_capacity: 2 };
      mockQueueModel.findById.mockResolvedValue(fullQueue);
      mockQueueModel.findEntryByUserAndQueue.mockResolvedValue(null);
      mockQueueModel.getWaitingEntries.mockResolvedValue([mockEntry, { ...mockEntry, id: 'other-entry' }]);

      const result = await QueueService.joinQueue('queue-uuid', 'new-user-uuid');

      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('maximum capacity');
    });

    it('should return error if queue not found', async () => {
      mockQueueModel.findById.mockResolvedValue(null);

      const result = await QueueService.joinQueue('nonexistent', 'user-uuid');

      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toBe('Queue not found');
    });
  });

  describe('leaveQueue', () => {
    it('should cancel the user queue entry', async () => {
      const cancelledEntry = { ...mockEntry, status: 'cancelled' as const };
      mockQueueModel.findEntryByUserAndQueue.mockResolvedValue(mockEntry);
      mockQueueModel.updateEntryStatus.mockResolvedValue(cancelledEntry);
      mockQueueModel.findById.mockResolvedValue(mockQueue);

      const result = await QueueService.leaveQueue('queue-uuid', 'user-uuid');

      expect(result).not.toBeNull();
      expect(mockQueueModel.updateEntryStatus).toHaveBeenCalledWith(mockEntry.id, 'cancelled');
    });

    it('should return null if user is not in queue', async () => {
      mockQueueModel.findEntryByUserAndQueue.mockResolvedValue(null);

      const result = await QueueService.leaveQueue('queue-uuid', 'user-uuid');

      expect(result).toBeNull();
    });
  });

  describe('callNextEntry', () => {
    it('should call the first waiting entry', async () => {
      const calledEntry = { ...mockEntry, status: 'called' as const, called_at: new Date() };
      mockQueueModel.getWaitingEntries.mockResolvedValue([mockEntry]);
      mockQueueModel.updateEntryStatus.mockResolvedValue(calledEntry);
      mockQueueModel.findById.mockResolvedValue(mockQueue);
      mockQueueModel.recalcAvgWaitTime.mockResolvedValue(12);

      const result = await QueueService.callNextEntry('queue-uuid');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('called');
      expect(mockWsService.broadcastToVenue).toHaveBeenCalled();
    });

    it('should return null if no waiting entries', async () => {
      mockQueueModel.getWaitingEntries.mockResolvedValue([]);

      const result = await QueueService.callNextEntry('queue-uuid');

      expect(result).toBeNull();
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status with estimated wait', async () => {
      mockQueueModel.getStatus.mockResolvedValue({
        queue: mockQueue,
        waitingCount: 3,
        entries: [mockEntry],
      });

      const result = await QueueService.getQueueStatus('queue-uuid');

      expect(result).not.toBeNull();
      expect(result!.estimatedWaitMinutes).toBe(30);
      expect(result!.waitingCount).toBe(3);
    });

    it('should return null for nonexistent queue', async () => {
      mockQueueModel.getStatus.mockResolvedValue(null);

      const result = await QueueService.getQueueStatus('nonexistent');

      expect(result).toBeNull();
    });
  });
});
