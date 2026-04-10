// Mock data for Smart Venue Experience System
// All data is pre-generated and simulates a live sporting event

export interface Venue {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentAttendees: number;
  event: string;
  eventTime: string;
  sections: Section[];
  facilities: Facility[];
}

export interface Section {
  id: string;
  name: string;
  level: number;
  capacity: number;
  currentOccupancy: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Facility {
  id: string;
  type: 'restroom' | 'food' | 'merch' | 'firstaid' | 'exit';
  name: string;
  level: number;
  x: number;
  y: number;
  available: boolean;
}

export interface Queue {
  id: string;
  facilityId: string;
  facilityName: string;
  type: 'restroom' | 'food' | 'merch' | 'firstaid';
  currentSize: number;
  maxSize: number;
  waitMinutes: number;
  status: 'low' | 'medium' | 'high';
  icon: string;
}

export interface HeatmapZone {
  id: string;
  sectionId: string;
  name: string;
  density: number; // 0-100
  level: 'low' | 'medium' | 'high';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'critical';
  message: string;
  section: string;
  timestamp: string;
}

// ─── Venue Data ──────────────────────────────────────────────────────────────

export const venue: Venue = {
  id: 'venue-001',
  name: 'Grand Arena Stadium',
  type: 'Stadium',
  capacity: 65000,
  currentAttendees: 58420,
  event: 'Championship Finals 2026',
  eventTime: '7:30 PM',
  sections: [
    { id: 's1', name: 'North Stand', level: 1, capacity: 15000, currentOccupancy: 13200, x: 20, y: 5, width: 60, height: 18 },
    { id: 's2', name: 'South Stand', level: 1, capacity: 15000, currentOccupancy: 14100, x: 20, y: 77, width: 60, height: 18 },
    { id: 's3', name: 'East Wing', level: 1, capacity: 17500, currentOccupancy: 15800, x: 80, y: 23, width: 18, height: 54 },
    { id: 's4', name: 'West Wing', level: 1, capacity: 17500, currentOccupancy: 15320, x: 2, y: 23, width: 18, height: 54 },
    { id: 's5', name: 'Field', level: 0, capacity: 0, currentOccupancy: 0, x: 22, y: 25, width: 56, height: 50 },
  ],
  facilities: [
    { id: 'f1', type: 'restroom', name: 'Restroom - North A', level: 1, x: 25, y: 10, available: true },
    { id: 'f2', type: 'restroom', name: 'Restroom - South A', level: 1, x: 55, y: 82, available: true },
    { id: 'f3', type: 'food', name: 'Food Court - East', level: 1, x: 83, y: 35, available: true },
    { id: 'f4', type: 'food', name: 'Food Court - West', level: 1, x: 5, y: 60, available: true },
    { id: 'f5', type: 'merch', name: 'Merchandise Store', level: 1, x: 45, y: 8, available: true },
    { id: 'f6', type: 'firstaid', name: 'First Aid Station', level: 1, x: 83, y: 60, available: true },
    { id: 'f7', type: 'exit', name: 'Main Exit Gate 1', level: 0, x: 45, y: 96, available: true },
    { id: 'f8', type: 'exit', name: 'Emergency Exit N', level: 0, x: 45, y: 2, available: true },
  ],
};

// ─── Queue Data ───────────────────────────────────────────────────────────────

export const queues: Queue[] = [
  {
    id: 'q1',
    facilityId: 'f1',
    facilityName: 'Restroom - North A',
    type: 'restroom',
    currentSize: 8,
    maxSize: 20,
    waitMinutes: 5,
    status: 'low',
    icon: '🚻',
  },
  {
    id: 'q2',
    facilityId: 'f3',
    facilityName: 'Food Court - East',
    type: 'food',
    currentSize: 15,
    maxSize: 25,
    waitMinutes: 12,
    status: 'high',
    icon: '🍕',
  },
  {
    id: 'q3',
    facilityId: 'f5',
    facilityName: 'Merchandise Store',
    type: 'merch',
    currentSize: 3,
    maxSize: 15,
    waitMinutes: 2,
    status: 'low',
    icon: '🎽',
  },
  {
    id: 'q4',
    facilityId: 'f2',
    facilityName: 'Restroom - South A',
    type: 'restroom',
    currentSize: 12,
    maxSize: 20,
    waitMinutes: 8,
    status: 'medium',
    icon: '🚻',
  },
  {
    id: 'q5',
    facilityId: 'f4',
    facilityName: 'Food Court - West',
    type: 'food',
    currentSize: 9,
    maxSize: 25,
    waitMinutes: 7,
    status: 'medium',
    icon: '🌮',
  },
];

// ─── Heatmap Data ─────────────────────────────────────────────────────────────

export const heatmapZones: HeatmapZone[] = [
  { id: 'h1', sectionId: 's1', name: 'North Stand', density: 88, level: 'high', x: 20, y: 5, width: 60, height: 18 },
  { id: 'h2', sectionId: 's2', name: 'South Stand', density: 94, level: 'high', x: 20, y: 77, width: 60, height: 18 },
  { id: 'h3', sectionId: 's3', name: 'East Wing', density: 72, level: 'medium', x: 80, y: 23, width: 18, height: 54 },
  { id: 'h4', sectionId: 's4', name: 'West Wing', density: 62, level: 'medium', x: 2, y: 23, width: 18, height: 54 },
  { id: 'h5', sectionId: 's5', name: 'Field', density: 0, level: 'low', x: 22, y: 25, width: 56, height: 50 },
];

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alerts: Alert[] = [
  {
    id: 'a1',
    type: 'warning',
    message: 'High crowd density detected in South Stand',
    section: 'South Stand',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: 'a2',
    type: 'info',
    message: 'Food Court East queue exceeds 15 people',
    section: 'East Wing',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: 'a3',
    type: 'warning',
    message: 'North Stand approaching capacity (88%)',
    section: 'North Stand',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  },
];

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analytics = {
  totalAttendees: venue.currentAttendees,
  capacityPercent: Math.round((venue.currentAttendees / venue.capacity) * 100),
  avgWaitTime: Math.round(queues.reduce((s, q) => s + q.waitMinutes, 0) / queues.length),
  activeQueues: queues.length,
  alertCount: alerts.filter((a) => a.type !== 'info').length,
  peakSection: 'South Stand',
  peakDensity: 94,
  hourlyFlow: [
    { hour: '5 PM', count: 12000 },
    { hour: '6 PM', count: 35000 },
    { hour: '7 PM', count: 58420 },
    { hour: '8 PM', count: 58100 },
    { hour: '9 PM', count: 45000 },
    { hour: '10 PM', count: 22000 },
  ],
};
