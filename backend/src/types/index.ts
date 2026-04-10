export type UserRole = 'admin' | 'staff' | 'attendee';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  floor_plan_url: string | null;
  latitude: number;
  longitude: number;
  amenities: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type QueueStatus = 'active' | 'paused' | 'closed';
export type QueueEntryStatus = 'waiting' | 'called' | 'served' | 'cancelled' | 'no_show';

export interface Queue {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  status: QueueStatus;
  max_capacity: number | null;
  avg_wait_time_minutes: number;
  current_position: number;
  created_at: Date;
  updated_at: Date;
}

export interface QueueEntry {
  id: string;
  queue_id: string;
  user_id: string;
  position: number;
  status: QueueEntryStatus;
  party_size: number;
  notes: string | null;
  joined_at: Date;
  called_at: Date | null;
  served_at: Date | null;
  cancelled_at: Date | null;
  estimated_wait_minutes: number | null;
}

export type SensorType = 'occupancy' | 'temperature' | 'humidity' | 'air_quality' | 'noise' | 'crowd_density';

export interface Sensor {
  id: string;
  venue_id: string;
  name: string;
  sensor_type: SensorType;
  location_description: string;
  latitude: number | null;
  longitude: number | null;
  floor_level: number | null;
  api_key_hash: string;
  is_active: boolean;
  last_reading_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value: number;
  unit: string;
  metadata: Record<string, unknown> | null;
  recorded_at: Date;
}

export interface NavigationZone {
  id: string;
  venue_id: string;
  name: string;
  zone_type: string;
  floor_level: number;
  coordinates: GeoPolygon;
  capacity: number | null;
  amenity_type: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface NavigationRoute {
  id: string;
  venue_id: string;
  from_zone_id: string;
  to_zone_id: string;
  distance_meters: number;
  estimated_walk_seconds: number;
  accessibility_friendly: boolean;
  waypoints: GeoPoint[];
  created_at: Date;
  updated_at: Date;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  floor_level?: number;
}

export interface AnalyticsEvent {
  id: string;
  venue_id: string | null;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export type WebSocketEventType =
  | 'queue:updated'
  | 'queue:entry:called'
  | 'queue:entry:joined'
  | 'sensor:reading'
  | 'venue:occupancy:updated'
  | 'navigation:congestion:reported'
  | 'ping'
  | 'pong';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
  venueId?: string;
}

export interface QueueUpdatePayload {
  queueId: string;
  venueId: string;
  currentLength: number;
  avgWaitMinutes: number;
  status: QueueStatus;
}

export interface SensorReadingPayload {
  sensorId: string;
  venueId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
