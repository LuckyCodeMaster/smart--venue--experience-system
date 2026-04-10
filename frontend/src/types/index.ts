// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff' | 'visitor';
  venueId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: User['role'];
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Venue ───────────────────────────────────────────────────────────────────

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  status: 'open' | 'closed' | 'maintenance';
  amenities: string[];
  coordinates?: { lat: number; lng: number };
  floorPlans?: FloorPlan[];
  zones: VenueZone[];
  createdAt: string;
  updatedAt: string;
}

export interface FloorPlan {
  id: string;
  floor: number;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
}

export interface VenueZone {
  id: string;
  venueId: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  type: 'entrance' | 'exit' | 'seating' | 'standing' | 'restricted';
  coordinates: { x: number; y: number; width: number; height: number };
}

// ─── Queue ───────────────────────────────────────────────────────────────────

export interface Queue {
  id: string;
  venueId: string;
  venueName: string;
  name: string;
  description: string;
  type: 'general' | 'vip' | 'accessibility' | 'express';
  status: 'active' | 'paused' | 'closed' | 'full';
  currentLength: number;
  maxLength: number;
  averageWaitTime: number;
  estimatedWaitTime: number;
  position?: number;
  isUserInQueue?: boolean;
  userTicketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueTicket {
  id: string;
  queueId: string;
  userId: string;
  position: number;
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'no-show';
  estimatedWaitTime: number;
  joinedAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface QueueEvent {
  type: 'joined' | 'left' | 'called' | 'position_update' | 'status_change';
  queueId: string;
  ticketId?: string;
  position?: number;
  waitTime?: number;
  timestamp: string;
}

// ─── Sensor ──────────────────────────────────────────────────────────────────

export type SensorType =
  | 'occupancy'
  | 'temperature'
  | 'humidity'
  | 'air_quality'
  | 'noise'
  | 'camera'
  | 'door_counter';

export type SensorStatus = 'online' | 'offline' | 'warning' | 'error';

export interface Sensor {
  id: string;
  venueId: string;
  zoneId?: string;
  name: string;
  type: SensorType;
  status: SensorStatus;
  location: string;
  lastReading?: SensorReading;
  lastSeen: string;
  batteryLevel?: number;
  firmware?: string;
  createdAt: string;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SensorHistory {
  sensorId: string;
  readings: SensorReading[];
  from: string;
  to: string;
}

// ─── Analytics / Dashboard ───────────────────────────────────────────────────

export interface OccupancyDataPoint {
  timestamp: string;
  occupancy: number;
  capacity: number;
  percentage: number;
}

export interface DashboardMetrics {
  totalVenues: number;
  totalOccupancy: number;
  totalCapacity: number;
  occupancyPercentage: number;
  activeQueues: number;
  totalQueueLength: number;
  averageWaitTime: number;
  activeAlerts: number;
  sensorsOnline: number;
  sensorsTotal: number;
}

export interface Alert {
  id: string;
  venueId: string;
  type: 'capacity' | 'sensor' | 'queue' | 'security' | 'system';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  isRead: boolean;
  createdAt: string;
  resolvedAt?: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavigationRoute {
  id: string;
  venueId: string;
  name: string;
  from: string;
  to: string;
  steps: NavigationStep[];
  estimatedTime: number;
  distance: number;
}

export interface NavigationStep {
  order: number;
  instruction: string;
  landmark?: string;
  direction: 'straight' | 'left' | 'right' | 'up' | 'down';
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    queueUpdates: boolean;
    capacityAlerts: boolean;
    sensorAlerts: boolean;
  };
  display: {
    darkMode: boolean;
    compactView: boolean;
    language: string;
    timezone: string;
  };
}
