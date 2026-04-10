import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { updateUserLocation } from '../store/slices/navigationSlice';
import locationService from '../services/locationService';
import { MainStackParamList, Coordinate } from '../types';

type MapNavProp = NativeStackNavigationProp<MainStackParamList>;

const VENUE_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapNavProp>();
  const dispatch = useAppDispatch();
  const mapRef = useRef<MapView>(null);
  const { currentRoute, userLocation, nearbyAmenities } = useAppSelector(
    (state) => state.navigation
  );
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);

  useEffect(() => {
    startLocationTracking();
    return () => locationService.stopWatching();
  }, []);

  useEffect(() => {
    if (userLocation && isFollowing && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        500
      );
    }
  }, [userLocation, isFollowing]);

  const startLocationTracking = async () => {
    try {
      const granted = await locationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Location Required',
          'Enable location permissions to use indoor navigation.',
          [{ text: 'OK' }]
        );
        return;
      }

      locationService.startWatching(
        (coord: Coordinate) => dispatch(updateUserLocation(coord)),
        (error) => console.warn('Location error:', error.message)
      );
    } catch (error) {
      console.error('Location setup failed:', error);
    }
  };

  const routeCoordinates =
    currentRoute?.steps.map((s) => s.coordinate) ?? [];

  const amenityEmoji = (type: string) => {
    const map: Record<string, string> = {
      restroom: '🚻',
      food: '🍔',
      drink: '🥤',
      atm: '🏧',
      firstaid: '🏥',
      elevator: '🛗',
      stairs: '🪜',
      exit: '🚪',
    };
    return map[type] ?? '📍';
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={VENUE_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsBuildings
        showsIndoors
        onPanDrag={() => setIsFollowing(false)}
      >
        {/* Navigation route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#1a237e"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Amenity markers */}
        {nearbyAmenities.map((amenity) => (
          <Marker
            key={amenity.id}
            coordinate={{ latitude: amenity.latitude, longitude: amenity.longitude }}
            title={amenity.name}
            description={amenity.status}
          >
            <View style={styles.amenityMarker}>
              <Text style={styles.amenityEmoji}>{amenityEmoji(amenity.type)}</Text>
            </View>
          </Marker>
        ))}

        {/* Destination marker */}
        {currentRoute && (
          <Marker
            coordinate={currentRoute.endPoint}
            title="Destination"
            pinColor="#ef4444"
          />
        )}
      </MapView>

      {/* Floor selector */}
      <View style={styles.floorSelector}>
        {[0, 1, 2, 3].map((floor) => (
          <TouchableOpacity
            key={floor}
            style={[styles.floorBtn, selectedFloor === floor && styles.floorBtnActive]}
            onPress={() => setSelectedFloor(floor)}
          >
            <Text style={[styles.floorBtnText, selectedFloor === floor && styles.floorBtnTextActive]}>
              {floor === 0 ? 'G' : floor}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recenter button */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={() => {
          setIsFollowing(true);
          if (userLocation) {
            mapRef.current?.animateToRegion(
              { ...userLocation, latitudeDelta: 0.002, longitudeDelta: 0.002 },
              500
            );
          }
        }}
        accessibilityLabel="Recenter map on my location"
      >
        <Text style={styles.recenterIcon}>📍</Text>
      </TouchableOpacity>

      {/* Navigate button */}
      <TouchableOpacity
        style={styles.navigateBtn}
        onPress={() => navigation.navigate('Navigation', {})}
        accessibilityRole="button"
      >
        <Text style={styles.navigateBtnText}>
          {currentRoute ? '▶ Continue Navigation' : '🗺️ Start Navigation'}
        </Text>
      </TouchableOpacity>

      {/* Indoor overlay badge */}
      <View style={styles.indoorBadge}>
        <Text style={styles.indoorBadgeText}>🏟️ Floor {selectedFloor === 0 ? 'G' : selectedFloor}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  floorSelector: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  floorBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  floorBtnActive: { backgroundColor: '#1a237e' },
  floorBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  floorBtnTextActive: { color: '#fff' },
  recenterBtn: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  recenterIcon: { fontSize: 22 },
  navigateBtn: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#1a237e',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  navigateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  indoorBadge: {
    position: 'absolute',
    top: 52,
    left: 16,
    backgroundColor: 'rgba(26,35,126,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  indoorBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  amenityMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  amenityEmoji: { fontSize: 18 },
});

export default MapScreen;
