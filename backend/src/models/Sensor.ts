import db from '../config/database';
import { Sensor, SensorReading } from '../types';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

const SENSORS_TABLE = 'sensors';
const READINGS_TABLE = 'sensor_readings';

export const SensorModel = {
  async findAll(venueId?: string): Promise<Sensor[]> {
    const query = db<Sensor>(SENSORS_TABLE).select('*').orderBy('name', 'asc');
    if (venueId) query.where({ venue_id: venueId });
    return query;
  },

  async findById(id: string): Promise<Sensor | null> {
    const sensor = await db<Sensor>(SENSORS_TABLE).where({ id }).first();
    return sensor ?? null;
  },

  async create(
    data: Omit<Sensor, 'id' | 'api_key_hash' | 'last_reading_at' | 'created_at' | 'updated_at'>
  ): Promise<{ sensor: Sensor; rawApiKey: string }> {
    const rawApiKey = `${uuidv4()}-${env.SENSOR_API_KEY_SALT}`;
    const api_key_hash = await bcrypt.hash(rawApiKey, 10);
    const id = uuidv4();
    const now = new Date();

    const [sensor] = await db<Sensor>(SENSORS_TABLE)
      .insert({
        id,
        ...data,
        api_key_hash,
        is_active: true,
        last_reading_at: null,
        created_at: now,
        updated_at: now,
      })
      .returning('*');

    return { sensor, rawApiKey };
  },

  async update(id: string, data: Partial<Omit<Sensor, 'id' | 'created_at'>>): Promise<Sensor | null> {
    const [sensor] = await db<Sensor>(SENSORS_TABLE)
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    return sensor ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const count = await db<Sensor>(SENSORS_TABLE).where({ id }).delete();
    return count > 0;
  },

  async verifyApiKey(sensorId: string, rawApiKey: string): Promise<boolean> {
    const sensor = await db<Sensor>(SENSORS_TABLE).where({ id: sensorId, is_active: true }).first();
    if (!sensor) return false;
    return bcrypt.compare(rawApiKey, sensor.api_key_hash);
  },

  async addReading(
    sensorId: string,
    value: number,
    unit: string,
    recordedAt: Date,
    metadata: Record<string, unknown> = {}
  ): Promise<SensorReading> {
    const id = uuidv4();
    const [reading] = await db<SensorReading>(READINGS_TABLE)
      .insert({ id, sensor_id: sensorId, value, unit, metadata, recorded_at: recordedAt })
      .returning('*');

    await db<Sensor>(SENSORS_TABLE)
      .where({ id: sensorId })
      .update({ last_reading_at: recordedAt, updated_at: new Date() });

    return reading;
  },

  async getReadings(
    sensorId: string,
    from: Date,
    to: Date,
    limit = 1000
  ): Promise<SensorReading[]> {
    return db<SensorReading>(READINGS_TABLE)
      .where({ sensor_id: sensorId })
      .whereBetween('recorded_at', [from, to])
      .orderBy('recorded_at', 'desc')
      .limit(limit);
  },

  async getLatestReading(sensorId: string): Promise<SensorReading | null> {
    const reading = await db<SensorReading>(READINGS_TABLE)
      .where({ sensor_id: sensorId })
      .orderBy('recorded_at', 'desc')
      .first();
    return reading ?? null;
  },

  async getAggregatedReadings(
    sensorId: string,
    from: Date,
    to: Date,
    intervalMinutes: number
  ): Promise<{ bucket: string; avg: number; min: number; max: number; count: number }[]> {
    return db(READINGS_TABLE)
      .where({ sensor_id: sensorId })
      .whereBetween('recorded_at', [from, to])
      .select(
        db.raw(
          `date_trunc('minute', recorded_at - (EXTRACT(MINUTE FROM recorded_at)::int % ? * interval '1 minute')) as bucket`,
          [intervalMinutes]
        ),
        db.raw('AVG(value) as avg'),
        db.raw('MIN(value) as min'),
        db.raw('MAX(value) as max'),
        db.raw('COUNT(*) as count')
      )
      .groupByRaw('1')
      .orderBy('bucket', 'asc') as Promise<{ bucket: string; avg: number; min: number; max: number; count: number }[]>;
  },
};

export default SensorModel;
