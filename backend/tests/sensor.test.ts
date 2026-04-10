import { SensorService } from '../src/services/sensorService';
import { SensorModel } from '../src/models/Sensor';
import { WebSocketService } from '../src/services/websocketService';
import { CacheService } from '../src/services/cacheService';
import { Sensor, SensorReading } from '../src/types';

jest.mock('../src/models/Sensor');
jest.mock('../src/services/websocketService');
jest.mock('../src/services/cacheService');

const mockSensorModel = SensorModel as jest.Mocked<typeof SensorModel>;
const mockWsService = WebSocketService as jest.Mocked<typeof WebSocketService>;
const mockCacheService = CacheService as jest.Mocked<typeof CacheService>;

const mockSensor: Sensor = {
  id: 'sensor-uuid',
  venue_id: 'venue-uuid',
  name: 'Entry Occupancy Sensor',
  sensor_type: 'occupancy',
  location_description: 'Main entrance',
  latitude: 51.5,
  longitude: -0.1,
  floor_level: 0,
  api_key_hash: 'hashed-api-key',
  is_active: true,
  last_reading_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
};

const mockReading: SensorReading = {
  id: 'reading-uuid',
  sensor_id: 'sensor-uuid',
  value: 75.5,
  unit: 'percent',
  metadata: {},
  recorded_at: new Date(),
};

describe('SensorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheService.get.mockResolvedValue(null);
    mockCacheService.set.mockResolvedValue(undefined);
    mockWsService.broadcastToVenue.mockImplementation(() => undefined);
  });

  describe('ingestReading', () => {
    it('should record a valid sensor reading', async () => {
      mockSensorModel.verifyApiKey.mockResolvedValue(true);
      mockSensorModel.addReading.mockResolvedValue(mockReading);
      mockSensorModel.findById.mockResolvedValue(mockSensor);

      const result = await SensorService.ingestReading(
        'sensor-uuid',
        'valid-api-key',
        75.5,
        'percent',
        new Date(),
        {}
      );

      expect(result).not.toBeNull();
      expect(result!.value).toBe(75.5);
      expect(mockSensorModel.addReading).toHaveBeenCalledWith(
        'sensor-uuid',
        75.5,
        'percent',
        expect.any(Date),
        {}
      );
    });

    it('should return null for invalid API key', async () => {
      mockSensorModel.verifyApiKey.mockResolvedValue(false);

      const result = await SensorService.ingestReading(
        'sensor-uuid',
        'invalid-key',
        75.5,
        'percent',
        new Date()
      );

      expect(result).toBeNull();
      expect(mockSensorModel.addReading).not.toHaveBeenCalled();
    });

    it('should broadcast WebSocket event on successful ingestion', async () => {
      mockSensorModel.verifyApiKey.mockResolvedValue(true);
      mockSensorModel.addReading.mockResolvedValue(mockReading);
      mockSensorModel.findById.mockResolvedValue(mockSensor);

      await SensorService.ingestReading('sensor-uuid', 'valid-key', 75.5, 'percent', new Date());

      expect(mockWsService.broadcastToVenue).toHaveBeenCalledWith(
        'venue-uuid',
        expect.objectContaining({
          type: 'sensor:reading',
          payload: expect.objectContaining({
            sensorId: 'sensor-uuid',
            value: 75.5,
          }),
        })
      );
    });

    it('should broadcast occupancy update for occupancy sensors', async () => {
      mockSensorModel.verifyApiKey.mockResolvedValue(true);
      mockSensorModel.addReading.mockResolvedValue(mockReading);
      mockSensorModel.findById.mockResolvedValue(mockSensor);

      await SensorService.ingestReading('sensor-uuid', 'valid-key', 75.5, 'percent', new Date());

      const calls = mockWsService.broadcastToVenue.mock.calls;
      const occupancyBroadcast = calls.find(
        (c) => (c[1] as { type: string }).type === 'venue:occupancy:updated'
      );
      expect(occupancyBroadcast).toBeDefined();
    });

    it('should not broadcast occupancy update for temperature sensors', async () => {
      const tempSensor: Sensor = { ...mockSensor, sensor_type: 'temperature' };
      mockSensorModel.verifyApiKey.mockResolvedValue(true);
      mockSensorModel.addReading.mockResolvedValue(mockReading);
      mockSensorModel.findById.mockResolvedValue(tempSensor);

      await SensorService.ingestReading('sensor-uuid', 'valid-key', 22.5, 'celsius', new Date());

      const calls = mockWsService.broadcastToVenue.mock.calls;
      const occupancyBroadcast = calls.find(
        (c) => (c[1] as { type: string }).type === 'venue:occupancy:updated'
      );
      expect(occupancyBroadcast).toBeUndefined();
    });
  });

  describe('getSensorStatus', () => {
    it('should return online status for recently active sensor', async () => {
      const recentSensor = { ...mockSensor, last_reading_at: new Date() };
      mockSensorModel.findById.mockResolvedValue(recentSensor);
      mockSensorModel.getLatestReading.mockResolvedValue(mockReading);

      const result = await SensorService.getSensorStatus('sensor-uuid');

      expect(result).not.toBeNull();
      expect(result!.isOnline).toBe(true);
    });

    it('should return offline status for stale sensor', async () => {
      const staleSensor = {
        ...mockSensor,
        last_reading_at: new Date(Date.now() - 10 * 60 * 1000),
      };
      mockSensorModel.findById.mockResolvedValue(staleSensor);
      mockSensorModel.getLatestReading.mockResolvedValue(null);

      const result = await SensorService.getSensorStatus('sensor-uuid');

      expect(result).not.toBeNull();
      expect(result!.isOnline).toBe(false);
    });

    it('should return null for nonexistent sensor', async () => {
      mockSensorModel.findById.mockResolvedValue(null);

      const result = await SensorService.getSensorStatus('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSensorHistory', () => {
    it('should return raw and aggregated readings', async () => {
      const rawReadings = [mockReading, { ...mockReading, id: 'reading-2', value: 80 }];
      const aggregated = [{ bucket: '2024-01-01T00:00:00Z', avg: 77.75, min: 75.5, max: 80, count: 2 }];

      mockSensorModel.getReadings.mockResolvedValue(rawReadings);
      mockSensorModel.getAggregatedReadings.mockResolvedValue(aggregated);

      const from = new Date(Date.now() - 3600000);
      const to = new Date();
      const result = await SensorService.getSensorHistory('sensor-uuid', from, to, 5);

      expect(result.raw).toHaveLength(2);
      expect(result.aggregated).toHaveLength(1);
      expect(result.aggregated[0]!.avg).toBe(77.75);
    });
  });

  describe('listSensors', () => {
    it('should paginate sensors correctly', async () => {
      const sensors = Array.from({ length: 25 }, (_, i) => ({
        ...mockSensor,
        id: `sensor-${i}`,
        name: `Sensor ${i}`,
      }));
      mockSensorModel.findAll.mockResolvedValue(sensors);

      const result = await SensorService.listSensors({ page: 2, limit: 10, offset: 10 });

      expect(result.total).toBe(25);
      expect(result.data).toHaveLength(10);
    });
  });
});
