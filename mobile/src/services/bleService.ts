/**
 * BLE Beacon Service — Phase 1 stub using mock data.
 * In Phase 2 this will integrate with react-native-ble-plx or
 * @ibeacon/react-native-ranging to detect physical BLE beacons
 * for sub-meter indoor positioning.
 */

import { Coordinate } from '../types';

export interface Beacon {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  distance: number;
  name: string;
  coordinate: Coordinate;
  floor: number;
}

export interface BLEPosition {
  coordinate: Coordinate;
  floor: number;
  accuracy: number;
  timestamp: string;
}

// Mock beacon map for Phase 1 development
const MOCK_BEACONS: Beacon[] = [
  {
    uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
    major: 1,
    minor: 1,
    rssi: -65,
    distance: 2.1,
    name: 'Main Entrance Beacon',
    coordinate: { latitude: 37.7749, longitude: -122.4194 },
    floor: 0,
  },
  {
    uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
    major: 1,
    minor: 2,
    rssi: -72,
    distance: 4.5,
    name: 'Food Court Beacon',
    coordinate: { latitude: 37.7751, longitude: -122.419 },
    floor: 1,
  },
  {
    uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
    major: 1,
    minor: 3,
    rssi: -80,
    distance: 8.2,
    name: 'Queue Zone A Beacon',
    coordinate: { latitude: 37.7753, longitude: -122.4188 },
    floor: 1,
  },
];

type BeaconCallback = (beacons: Beacon[]) => void;
type PositionCallback = (position: BLEPosition) => void;

class BLEService {
  private isScanning = false;
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private beaconCallback?: BeaconCallback;
  private positionCallback?: PositionCallback;

  startScanning(onBeacons: BeaconCallback, onPosition?: PositionCallback): void {
    if (this.isScanning) return;

    this.beaconCallback = onBeacons;
    this.positionCallback = onPosition;
    this.isScanning = true;

    console.log('[BLEService] Phase 1 mock scanning started');

    // Simulate periodic beacon detection with jitter
    this.scanInterval = setInterval(() => {
      const detectedBeacons = this.simulateBeaconDetection();
      this.beaconCallback?.(detectedBeacons);

      if (this.positionCallback) {
        const position = this.trilaterate(detectedBeacons);
        if (position) {
          this.positionCallback(position);
        }
      }
    }, 2000);
  }

  stopScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
    console.log('[BLEService] Scanning stopped');
  }

  isActive(): boolean {
    return this.isScanning;
  }

  private simulateBeaconDetection(): Beacon[] {
    return MOCK_BEACONS.map((beacon) => ({
      ...beacon,
      rssi: beacon.rssi + Math.round((Math.random() - 0.5) * 10),
      distance: Math.max(0.5, beacon.distance + (Math.random() - 0.5) * 2),
    }));
  }

  private trilaterate(beacons: Beacon[]): BLEPosition | null {
    if (beacons.length < 2) return null;

    // Simplified weighted centroid — Phase 2 will use proper trilateration
    const totalWeight = beacons.reduce((sum, b) => sum + 1 / b.distance, 0);
    const lat =
      beacons.reduce((sum, b) => sum + b.coordinate.latitude / b.distance, 0) / totalWeight;
    const lng =
      beacons.reduce((sum, b) => sum + b.coordinate.longitude / b.distance, 0) / totalWeight;

    const closestBeacon = beacons.reduce((a, b) => (a.distance < b.distance ? a : b));

    return {
      coordinate: { latitude: lat, longitude: lng },
      floor: closestBeacon.floor,
      accuracy: closestBeacon.distance,
      timestamp: new Date().toISOString(),
    };
  }
}

export const bleService = new BLEService();
export default bleService;
