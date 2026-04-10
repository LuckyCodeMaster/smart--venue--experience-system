import db from '../config/database';
import { Venue } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TABLE = 'venues';

export const VenueModel = {
  async findAll(activeOnly = true): Promise<Venue[]> {
    const query = db<Venue>(TABLE).select('*').orderBy('name', 'asc');
    if (activeOnly) query.where({ is_active: true });
    return query;
  },

  async findById(id: string): Promise<Venue | null> {
    const venue = await db<Venue>(TABLE).where({ id }).first();
    return venue ?? null;
  },

  async findByName(name: string): Promise<Venue[]> {
    return db<Venue>(TABLE)
      .where('name', 'ilike', `%${name}%`)
      .where({ is_active: true })
      .select('*');
  },

  async create(data: Omit<Venue, 'id' | 'created_at' | 'updated_at'>): Promise<Venue> {
    const id = uuidv4();
    const now = new Date();
    const [venue] = await db<Venue>(TABLE)
      .insert({ id, ...data, created_at: now, updated_at: now })
      .returning('*');
    return venue;
  },

  async update(id: string, data: Partial<Omit<Venue, 'id' | 'created_at'>>): Promise<Venue | null> {
    const [venue] = await db<Venue>(TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return venue ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const count = await db<Venue>(TABLE).where({ id }).delete();
    return count > 0;
  },

  async deactivate(id: string): Promise<boolean> {
    const count = await db<Venue>(TABLE)
      .where({ id })
      .update({ is_active: false, updated_at: new Date() });
    return count > 0;
  },

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Venue[]> {
    return db<Venue>(TABLE)
      .whereRaw(
        `(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) < ?`,
        [lat, lng, lat, radiusKm]
      )
      .where({ is_active: true })
      .select('*');
  },

  async count(activeOnly = true): Promise<number> {
    const query = db<Venue>(TABLE).count<{ count: string }>('id as count').first();
    if (activeOnly) query.where({ is_active: true });
    const result = await query;
    return parseInt(result?.count ?? '0', 10);
  },

  async paginate(
    page: number,
    limit: number,
    activeOnly = true
  ): Promise<{ data: Venue[]; total: number }> {
    const offset = (page - 1) * limit;
    const query = db<Venue>(TABLE).select('*').orderBy('name', 'asc').limit(limit).offset(offset);
    if (activeOnly) query.where({ is_active: true });
    const [data, total] = await Promise.all([query, VenueModel.count(activeOnly)]);
    return { data, total };
  },
};

export default VenueModel;
