import { Request, Response } from 'express';
import { SensorService } from '../services/sensorService';
import { success, created, error, paginated, getPaginationParams } from '../utils/apiResponse';
import logger from '../utils/logger';

export const sensorController = {
  async ingestData(req: Request, res: Response): Promise<void> {
    try {
      const sensorId = req.params['sensorId']!;
      const apiKey = req.headers['x-sensor-api-key'] as string;

      if (!apiKey) {
        error(res, 'API key required', 401);
        return;
      }

      const { value, unit, recorded_at, metadata } = req.body as {
        value: number;
        unit: string;
        recorded_at?: string;
        metadata?: Record<string, unknown>;
      };

      const result = await SensorService.ingestReading(
        sensorId,
        apiKey,
        value,
        unit,
        recorded_at ? new Date(recorded_at) : new Date(),
        metadata
      );

      if (!result) {
        error(res, 'Invalid sensor ID or API key', 401);
        return;
      }

      created(res, result, 'Sensor reading recorded');
    } catch (err) {
      logger.error('IngestData error:', err);
      error(res, 'Failed to ingest sensor data', 500);
    }
  },

  async getSensors(req: Request, res: Response): Promise<void> {
    try {
      const { venue_id } = req.query as { venue_id?: string };
      const params = getPaginationParams(req.query as Record<string, unknown>);
      const { data, total } = await SensorService.listSensors(params, venue_id);
      paginated(res, data, total, params);
    } catch (err) {
      logger.error('GetSensors error:', err);
      error(res, 'Failed to fetch sensors', 500);
    }
  },

  async getSensorStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await SensorService.getSensorStatus(req.params['id']!);
      if (!status) {
        error(res, 'Sensor not found', 404);
        return;
      }
      success(res, status);
    } catch (err) {
      logger.error('GetSensorStatus error:', err);
      error(res, 'Failed to get sensor status', 500);
    }
  },

  async getSensorHistory(req: Request, res: Response): Promise<void> {
    try {
      const sensorId = req.params['id']!;
      const { from, to, interval } = req.query as {
        from?: string;
        to?: string;
        interval?: string;
      };

      const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to) : new Date();
      const intervalMinutes = interval ? parseInt(interval, 10) : 5;

      const history = await SensorService.getSensorHistory(
        sensorId,
        fromDate,
        toDate,
        intervalMinutes
      );

      success(res, history);
    } catch (err) {
      logger.error('GetSensorHistory error:', err);
      error(res, 'Failed to get sensor history', 500);
    }
  },

  async createSensor(req: Request, res: Response): Promise<void> {
    try {
      const result = await SensorService.createSensor(req.body as Parameters<typeof SensorService.createSensor>[0]);
      created(res, result, 'Sensor created. Store the API key securely - it will not be shown again.');
    } catch (err) {
      logger.error('CreateSensor error:', err);
      error(res, 'Failed to create sensor', 500);
    }
  },

  async deleteSensor(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await SensorService.deleteSensor(req.params['id']!);
      if (!deleted) {
        error(res, 'Sensor not found', 404);
        return;
      }
      success(res, null, 'Sensor deleted');
    } catch (err) {
      logger.error('DeleteSensor error:', err);
      error(res, 'Failed to delete sensor', 500);
    }
  },
};
