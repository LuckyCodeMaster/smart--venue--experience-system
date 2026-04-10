// Core domain types for the SVES mobile application

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'visitor' | 'staff' | 'admin';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: boolean;
  locationSharing: boolean;
  accessibilityMode: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  status: 'open' | 'closed' | 'limited';
  amenities: Amenity[];
  floors: VenueFloor[];
  operatingHours: OperatingHours;
  imageUrl?: string;
}

export interface VenueFloor {
  id: string;
  venueId: string;
  floorNumber: number;
  name: string;
  mapUrl: string;
  zones: Zone[];
}

export interface Zone {
  id: string;
  floorId: string;
  name: string;
  type: 'entrance' | 'exit' | 'amenity' | 'queue' | 'general';
  capacity: number;
  currentOccupancy: number;
  coordinates: Coordinate[];
}

export interface Amenity {
  id: string;
  venueId: string;
  type: 'restroom' | 'food' | 'drink' | 'atm' | 'firstaid' | 'elevator' | 'stairs' | 'exit';
  name: string;
  floor: number;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
  status: 'available' | 'busy' | 'closed';
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Queue {
  id: string;
  venueId: string;
  name: string;
  description: string;
  type: 'attraction' | 'food' | 'service' | 'entry';
  status: 'active' | 'paused' | 'closed';
  currentLength: number;
  estimatedWaitMinutes: number;
  maxCapacity: number;
  position?: QueuePosition;
  createdAt: string;
  updatedAt: string;
}

export interface QueuePosition {
  queueId: string;
  userId: string;
  position: number;
  estimatedWaitMinutes: number;
  joinedAt: string;
  notificationSent: boolean;
}

export interface NavigationRoute {
  id: string;
  venueId: string;
  startPoint: Coordinate;
  endPoint: Coordinate;
  steps: NavigationStep[];
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
  isAccessible: boolean;
}

export interface NavigationStep {
  stepNumber: number;
  instruction: string;
  distanceMeters: number;
  bearing: number;
  landmark?: string;
  floor?: number;
  coordinate: Coordinate;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface SensorReading {
  sensorId: string;
  type: 'occupancy' | 'temperature' | 'air_quality' | 'noise' | 'crowd_density';
  value: number;
  unit: string;
  timestamp: string;
  zoneId?: string;
  venueId: string;
}

export interface Notification {
  id: string;
  type: 'queue_ready' | 'queue_update' | 'venue_alert' | 'navigation' | 'general';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Navigation route param types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Queue: undefined;
  Map: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  HomeTabs: undefined;
  QueueDetail: { queueId: string };
  VenueDetail: { venueId: string };
  Navigation: { routeId?: string; destinationId?: string };
  Profile: undefined;
  Notifications: undefined;
};

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
