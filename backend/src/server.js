const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ── In-memory data ─────────────────────────────────────────────────────────────

const venueData = {
  name: 'Grand Arena',
  capacity: 5000,
  currentOccupancy: 2347,
  sections: [
    { id: 'A', name: 'Main Stage', capacity: 1500, occupancy: 892, color: '#ef4444' },
    { id: 'B', name: 'Food Court', capacity: 800,  occupancy: 634, color: '#f97316' },
    { id: 'C', name: 'Exhibition Hall', capacity: 1200, occupancy: 421, color: '#22c55e' },
    { id: 'D', name: 'VIP Lounge', capacity: 300, occupancy: 187, color: '#3b82f6' },
    { id: 'E', name: 'East Wing', capacity: 700, occupancy: 156, color: '#22c55e' },
    { id: 'F', name: 'West Wing', capacity: 500, occupancy: 57,  color: '#22c55e' }
  ],
  facilities: [
    { id: 1, name: 'Restrooms', icon: '🚻', location: 'Multiple locations', status: 'Available' },
    { id: 2, name: 'First Aid', icon: '🏥', location: 'Main entrance, Section C', status: 'Staffed' },
    { id: 3, name: 'Information Desk', icon: 'ℹ️', location: 'Main lobby', status: 'Open' },
    { id: 4, name: 'Parking', icon: '🅿️', location: 'North & South lots', status: '60% Full' },
    { id: 5, name: 'ATM', icon: '💳', location: 'Food court entrance', status: 'Available' },
    { id: 6, name: 'WiFi', icon: '📶', location: 'Venue-wide', status: 'Active' }
  ]
};

const queues = [
  { id: 1, name: 'Main Stage Entry', location: 'Gate A', waitTime: 8, length: 34, maxLength: 100, status: 'open' },
  { id: 2, name: 'Food Court', location: 'Section B', waitTime: 12, length: 56, maxLength: 80, status: 'open' },
  { id: 3, name: 'VIP Check-in', location: 'Gate D', waitTime: 3, length: 8, maxLength: 30, status: 'open' },
  { id: 4, name: 'Merchandise', location: 'Main lobby', waitTime: 15, length: 72, maxLength: 100, status: 'open' },
  { id: 5, name: 'Exhibition Entry', location: 'Gate C', waitTime: 5, length: 21, maxLength: 60, status: 'open' }
];

const analytics = {
  peakHours: ['14:00', '15:00', '18:00', '19:00'],
  avgWaitTime: 9,
  bottlenecks: ['Food Court', 'Main Stage Entry'],
  satisfactionScore: 4.2,
  eventsToday: 3,
  staffOnDuty: 45,
  incidentsReported: 2,
  incidentsResolved: 2,
  hourlyOccupancy: [
    { hour: '10:00', count: 320 },
    { hour: '11:00', count: 780 },
    { hour: '12:00', count: 1250 },
    { hour: '13:00', count: 1890 },
    { hour: '14:00', count: 2540 },
    { hour: '15:00', count: 2890 },
    { hour: '16:00', count: 2347 },
    { hour: '17:00', count: 2100 },
    { hour: '18:00', count: 1870 }
  ]
};

// Track joined queues per visitor (session-based, in-memory)
const visitorQueues = new Map();

// ── Simulation: update data every 5 seconds ────────────────────────────────────

function simulateDataUpdates() {
  // Gently vary occupancy
  venueData.sections.forEach(section => {
    const delta = Math.floor(Math.random() * 11) - 5;
    section.occupancy = Math.min(section.capacity, Math.max(0, section.occupancy + delta));
    const pct = section.occupancy / section.capacity;
    section.color = pct > 0.8 ? '#ef4444' : pct > 0.5 ? '#f97316' : '#22c55e';
  });
  venueData.currentOccupancy = venueData.sections.reduce((s, sec) => s + sec.occupancy, 0);

  // Vary queue lengths
  queues.forEach(q => {
    const delta = Math.floor(Math.random() * 7) - 3;
    q.length = Math.min(q.maxLength, Math.max(0, q.length + delta));
    q.waitTime = Math.max(1, Math.round(q.length * 0.22));
  });

  broadcastUpdate();
}

setInterval(simulateDataUpdates, 5000);

// ── WebSocket broadcast ────────────────────────────────────────────────────────

function broadcastUpdate() {
  const payload = JSON.stringify({
    type: 'UPDATE',
    venue: venueData,
    queues,
    analytics,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', ws => {
  // Send initial state on connect
  ws.send(JSON.stringify({
    type: 'INIT',
    venue: venueData,
    queues,
    analytics,
    timestamp: new Date().toISOString()
  }));

  ws.on('error', () => {});
});

// ── REST endpoints ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/venue', (_req, res) => res.json(venueData));

app.get('/api/queues', (_req, res) => res.json(queues));

app.get('/api/analytics', (_req, res) => res.json(analytics));

app.post('/api/queue/join', (req, res) => {
  const { queueId, visitorId } = req.body;
  if (!queueId) return res.status(400).json({ error: 'queueId required' });

  const queue = queues.find(q => q.id === Number(queueId));
  if (!queue) return res.status(404).json({ error: 'Queue not found' });
  if (queue.status !== 'open') return res.status(409).json({ error: 'Queue is closed' });

  // Record visitor
  const vid = visitorId || `anon-${Date.now()}`;
  visitorQueues.set(vid, queueId);

  queue.length = Math.min(queue.maxLength, queue.length + 1);
  queue.waitTime = Math.max(1, Math.round(queue.length * 0.22));

  broadcastUpdate();

  res.json({
    success: true,
    visitorId: vid,
    queue: { id: queue.id, name: queue.name, waitTime: queue.waitTime, position: queue.length }
  });
});

app.post('/api/queue/leave', (req, res) => {
  const { queueId, visitorId } = req.body;
  if (!queueId || !visitorId) return res.status(400).json({ error: 'queueId and visitorId required' });

  const queue = queues.find(q => q.id === Number(queueId));
  if (queue && queue.length > 0) {
    queue.length = Math.max(0, queue.length - 1);
    queue.waitTime = Math.max(1, Math.round(queue.length * 0.22));
    visitorQueues.delete(visitorId);
    broadcastUpdate();
  }

  res.json({ success: true });
});

// ── Start server ───────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SVES Backend running on port ${PORT}`);
});

module.exports = { app, server };
