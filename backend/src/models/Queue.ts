import db from '../config/database';
import { Queue, QueueEntry, QueueStatus, QueueEntryStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

const QUEUES_TABLE = 'queues';
const ENTRIES_TABLE = 'queue_entries';

export const QueueModel = {
  async findAll(filters: Partial<Queue> = {}): Promise<Queue[]> {
    return db<Queue>(QUEUES_TABLE).where(filters).select('*').orderBy('created_at', 'asc');
  },

  async findById(id: string): Promise<Queue | null> {
    const queue = await db<Queue>(QUEUES_TABLE).where({ id }).first();
    return queue ?? null;
  },

  async findByVenueId(venueId: string, status?: QueueStatus): Promise<Queue[]> {
    const query = db<Queue>(QUEUES_TABLE)
      .where({ venue_id: venueId })
      .orderBy('name', 'asc');
    if (status) query.where({ status });
    return query;
  },

  async create(data: {
    venue_id: string;
    name: string;
    description?: string | null;
    max_capacity?: number | null;
  }): Promise<Queue> {
    const id = uuidv4();
    const now = new Date();
    const [queue] = await db<Queue>(QUEUES_TABLE)
      .insert({
        id,
        venue_id: data.venue_id,
        name: data.name,
        description: data.description ?? null,
        status: 'active',
        max_capacity: data.max_capacity ?? null,
        avg_wait_time_minutes: 0,
        current_position: 0,
        created_at: now,
        updated_at: now,
      })
      .returning('*');
    return queue;
  },

  async update(id: string, data: Partial<Omit<Queue, 'id' | 'created_at'>>): Promise<Queue | null> {
    const [queue] = await db<Queue>(QUEUES_TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return queue ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const count = await db<Queue>(QUEUES_TABLE).where({ id }).delete();
    return count > 0;
  },

  async getStatus(id: string): Promise<{
    queue: Queue;
    waitingCount: number;
    entries: QueueEntry[];
  } | null> {
    const queue = await QueueModel.findById(id);
    if (!queue) return null;

    const entries = await db<QueueEntry>(ENTRIES_TABLE)
      .where({ queue_id: id, status: 'waiting' })
      .orderBy('position', 'asc');

    return { queue, waitingCount: entries.length, entries };
  },

  async addEntry(data: {
    queue_id: string;
    user_id: string;
    party_size?: number;
    notes?: string | null;
  }): Promise<QueueEntry> {
    const maxPositionResult = await db<QueueEntry>(ENTRIES_TABLE)
      .where({ queue_id: data.queue_id, status: 'waiting' })
      .max<{ max: number | null }>('position as max')
      .first();
    const position = (maxPositionResult?.max ?? 0) + 1;

    const id = uuidv4();
    const [entry] = await db<QueueEntry>(ENTRIES_TABLE)
      .insert({
        id,
        queue_id: data.queue_id,
        user_id: data.user_id,
        position,
        status: 'waiting',
        party_size: data.party_size ?? 1,
        notes: data.notes ?? null,
        joined_at: new Date(),
        called_at: null,
        served_at: null,
        cancelled_at: null,
        estimated_wait_minutes: null,
      })
      .returning('*');

    await db<Queue>(QUEUES_TABLE)
      .where({ id: data.queue_id })
      .increment('current_position', 1)
      .update({ updated_at: new Date() });

    return entry;
  },

  async updateEntryStatus(
    entryId: string,
    status: QueueEntryStatus
  ): Promise<QueueEntry | null> {
    const now = new Date();
    const updateData: Partial<QueueEntry> = { status };

    if (status === 'called') updateData.called_at = now;
    if (status === 'served') updateData.served_at = now;
    if (status === 'cancelled') updateData.cancelled_at = now;

    const [entry] = await db<QueueEntry>(ENTRIES_TABLE)
      .where({ id: entryId })
      .update(updateData)
      .returning('*');
    return entry ?? null;
  },

  async findEntryByUserAndQueue(userId: string, queueId: string): Promise<QueueEntry | null> {
    const entry = await db<QueueEntry>(ENTRIES_TABLE)
      .where({ user_id: userId, queue_id: queueId })
      .whereIn('status', ['waiting', 'called'])
      .first();
    return entry ?? null;
  },

  async getWaitingEntries(queueId: string): Promise<QueueEntry[]> {
    return db<QueueEntry>(ENTRIES_TABLE)
      .where({ queue_id: queueId, status: 'waiting' })
      .orderBy('position', 'asc');
  },

  async recalcAvgWaitTime(queueId: string): Promise<number> {
    const result = await db<QueueEntry>(ENTRIES_TABLE)
      .where({ queue_id: queueId, status: 'served' })
      .whereNotNull('called_at')
      .whereNotNull('joined_at')
      .select(
        db.raw(`AVG(EXTRACT(EPOCH FROM (called_at - joined_at)) / 60) as avg_minutes`)
      )
      .first() as { avg_minutes: string | null } | undefined;

    const avgMinutes = parseFloat(result?.avg_minutes ?? '0') || 0;
    await db<Queue>(QUEUES_TABLE)
      .where({ id: queueId })
      .update({ avg_wait_time_minutes: avgMinutes, updated_at: new Date() });
    return avgMinutes;
  },
};

export default QueueModel;
