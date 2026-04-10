import { SensorModel } from '../models/Sensor';
import { Sensor, SensorReading, PaginationParams } from '../types';
import { WebSocketService } from './websocketService';
import { CacheService } from './cacheService';
import logger from '../utils/logger';

export const SensorService = {
  async listSensors(
    params: PaginationParams,
    venueId?: string
  ): Promise<{ data: Sensor[]; total: number }> {
    const all = await SensorModel.findAll(venueId);
    const data = all.slice(params.offset, params.offset + params.limit);
    return { data, total: all.length };
  },

  async createSensor(data: {
    venue_id: string;
    name: string;
    sensor_type: Sensor['sensor_type'];
    location_description: string;
    latitude?: number | null;
    longitude?: number | null;
    floor_level?: number | null;
  }): Promise<{ sensor: Sensor; apiKey: string }> {
    const { sensor, rawApiKey } = await SensorModel.create({
      ...data,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      floor_level: data.floor_level ?? null,
      is_active: true,
    });
    return { sensor, apiKey: rawApiKey };
  },

  async ingestReading(
    sensorId: string,
    rawApiKey: string,
    value: number,
    unit: string,
    recordedAt: Date,
    metadata: Record<string, unknown> = {}
  ): Promise<SensorReading | null> {
    const valid = await SensorModel.verifyApiKey(sensorId, rawApiKey);
    if (!valid) {
      logger.warn(`Invalid API key for sensor ${sensorId}`);
      return null;
    }

    const reading = await SensorModel.addReading(sensorId, value, unit, recordedAt, metadata);

    const sensor = await SensorModel.findById(sensorId);
    if (sensor) {
      await CacheService.set(
        `sensor:latest:${sensorId}`,
        { ...reading, sensor_type: sensor.sensor_type },
        60
      );

      WebSocketService.broadcastToVenue(sensor.venue_id, {
        type: 'sensor:reading',
        payload: {
          sensorId,
          venueId: sensor.venue_id,
          sensorType: sensor.sensor_type,
          value,
          unit,
          recordedAt: recordedAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
        venueId: sensor.venue_id,
      });

      if (sensor.sensor_type === 'occupancy' || sensor.sensor_type === 'crowd_density') {
        await CacheService.set(
          `venue:occupancy:${sensor.venue_id}`,
          { value, unit, sensorId, timestamp: recordedAt.toISOString() },
          120
        );

        WebSocketService.broadcastToVenue(sensor.venue_id, {
          type: 'venue:occupancy:updated',
          payload: { venueId: sensor.venue_id, value, unit, sensorId },
          timestamp: new Date().toISOString(),
          venueId: sensor.venue_id,
        });
      }
    }

    return reading;
  },

  async getSensorStatus(sensorId: string): Promise<{
    sensor: Sensor;
    latestReading: SensorReading | null;
    isOnline: boolean;
  } | null> {
    const sensor = await SensorModel.findById(sensorId);
    if (!sensor) return null;

    const latestReading = await SensorModel.getLatestReading(sensorId);
    const isOnline = sensor.last_reading_at
      ? Date.now() - new Date(sensor.last_reading_at).getTime() < 5 * 60 * 1000
      : false;

    return { sensor, latestReading, isOnline };
  },

  async getSensorHistory(
    sensorId: string,
    from: Date,
    to: Date,
    intervalMinutes: number
  ): Promise<{
    raw: SensorReading[];
    aggregated: { bucket: string; avg: number; min: number; max: number; count: number }[];
  }> {
    const [raw, aggregated] = await Promise.all([
      SensorModel.getReadings(sensorId, from, to, 500),
      SensorModel.getAggregatedReadings(sensorId, from, to, intervalMinutes),
    ]);
    return { raw, aggregated };
  },

  async deleteSensor(sensorId: string): Promise<boolean> {
    return SensorModel.delete(sensorId);
  },
};
