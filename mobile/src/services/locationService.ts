import Geolocation, {
  GeoPosition,
  GeoError,
  GeoOptions,
} from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Permission } from 'react-native';
import { Coordinate } from '../types';

const DEFAULT_OPTIONS: GeoOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  distanceFilter: 5,
};

export type LocationCallback = (coordinate: Coordinate) => void;
export type LocationErrorCallback = (error: GeoError) => void;

class LocationService {
  private watchId: number | null = null;
  private isPermissionGranted = false;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      this.isPermissionGranted = status === 'granted';
      return this.isPermissionGranted;
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION as Permission,
        {
          title: 'SVES Location Permission',
          message:
            'The Smart Venue Experience app needs access to your location ' +
            'to provide indoor navigation and personalized recommendations.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow',
        }
      );
      this.isPermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      return this.isPermissionGranted;
    }

    return false;
  }

  async getCurrentLocation(): Promise<Coordinate> {
    if (!this.isPermissionGranted) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: GeoPosition) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error: GeoError) => reject(error),
        DEFAULT_OPTIONS
      );
    });
  }

  startWatching(onLocation: LocationCallback, onError?: LocationErrorCallback): void {
    if (this.watchId !== null) {
      this.stopWatching();
    }

    this.watchId = Geolocation.watchPosition(
      (position: GeoPosition) => {
        onLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error: GeoError) => {
        if (onError) {
          onError(error);
        }
      },
      DEFAULT_OPTIONS
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  hasPermission(): boolean {
    return this.isPermissionGranted;
  }
}

export const locationService = new LocationService();
export default locationService;
