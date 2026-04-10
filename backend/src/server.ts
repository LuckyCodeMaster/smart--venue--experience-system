/**
 * Smart Venue Experience System - Backend Server
 * Single-file Express server with REST API + WebSocket (Socket.io)
 */

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import {
  venue,
  queues as initialQueues,
  heatmapZones as initialHeatmap,
  alerts as initialAlerts,
  analytics,
  Queue,
  HeatmapZone,
  Alert,
} from './mock-data';

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── In-Memory State ──────────────────────────────────────────────────────────

let queues = [...initialQueues];
let heatmapZones = [...initialHeatmap];
let activeAlerts = [...initialAlerts];
const virtualQueueMembers: Map<string, { queueId: string; joinedAt: string; position: number }> = new Map();

// ─── REST API Endpoints ───────────────────────────────────────────────────────

// GET /api/venue - Venue information
app.get('/api/venue', (_req, res) => {
  res.json({ success: true, data: venue });
});

// GET /api/queues - All queue statuses
app.get('/api/queues', (_req, res) => {
  res.json({ success: true, data: queues });
});

// GET /api/map - Venue map data (sections + facilities)
app.get('/api/map', (_req, res) => {
  res.json({
    success: true,
    data: {
      sections: venue.sections,
      facilities: venue.facilities,
    },
  });
});

// POST /api/queue/join - Join a virtual queue
app.post('/api/queue/join', (req, res) => {
  const { queueId, userId } = req.body as { queueId: string; userId?: string };

  const queue = queues.find((q) => q.id === queueId);
  if (!queue) {
    res.status(404).json({ success: false, error: 'Queue not found' });
    return;
  }

  const memberId = userId || uuidv4();

  // Check if already in queue
  if (virtualQueueMembers.has(memberId)) {
    const existing = virtualQueueMembers.get(memberId)!;
    if (existing.queueId === queueId) {
      res.json({
        success: true,
        data: {
          memberId,
          position: existing.position,
          estimatedWait: queue.waitMinutes,
          message: 'Already in queue',
        },
      });
      return;
    }
    // Remove from existing queue
    const oldQueue = queues.find((q) => q.id === existing.queueId);
    if (oldQueue) {
      oldQueue.currentSize = Math.max(0, oldQueue.currentSize - 1);
      updateQueueStatus(oldQueue);
    }
  }

  // Join the queue
  queue.currentSize++;
  queue.waitMinutes = calculateWaitTime(queue.currentSize);
  updateQueueStatus(queue);

  const position = queue.currentSize;
  virtualQueueMembers.set(memberId, {
    queueId,
    joinedAt: new Date().toISOString(),
    position,
  });

  // Broadcast update to all clients
  io.emit('queue:update', { queues });

  res.json({
    success: true,
    data: {
      memberId,
      queueId,
      facilityName: queue.facilityName,
      position,
      estimatedWait: queue.waitMinutes,
      message: `Joined ${queue.facilityName} queue at position #${position}`,
    },
  });
});

// GET /api/queue/status/:memberId - Check queue position
app.get('/api/queue/status/:memberId', (req, res) => {
  const { memberId } = req.params;
  const member = virtualQueueMembers.get(memberId);

  if (!member) {
    res.status(404).json({ success: false, error: 'Not found in any queue' });
    return;
  }

  const queue = queues.find((q) => q.id === member.queueId);
  res.json({
    success: true,
    data: {
      memberId,
      queueId: member.queueId,
      position: member.position,
      estimatedWait: queue?.waitMinutes || 0,
      joinedAt: member.joinedAt,
    },
  });
});

// GET /api/analytics - Crowd analytics data for staff dashboard
app.get('/api/analytics', (_req, res) => {
  const liveAnalytics = {
    ...analytics,
    totalAttendees: venue.currentAttendees,
    avgWaitTime: Math.round(queues.reduce((s, q) => s + q.waitMinutes, 0) / queues.length),
    activeQueues: queues.length,
    alertCount: activeAlerts.filter((a) => a.type !== 'info').length,
    heatmap: heatmapZones,
    alerts: activeAlerts,
    queues,
  };
  res.json({ success: true, data: liveAnalytics });
});

// GET /api/heatmap - Heatmap data
app.get('/api/heatmap', (_req, res) => {
  res.json({ success: true, data: heatmapZones });
});

// GET /api/alerts - Active alerts
app.get('/api/alerts', (_req, res) => {
  res.json({ success: true, data: activeAlerts });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── WebSocket ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send initial state on connect
  socket.emit('init', {
    venue,
    queues,
    heatmap: heatmapZones,
    alerts: activeAlerts,
    analytics: {
      ...analytics,
      avgWaitTime: Math.round(queues.reduce((s, q) => s + q.waitMinutes, 0) / queues.length),
    },
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ─── Simulation Loop ──────────────────────────────────────────────────────────

// Simulate real-time queue fluctuations every 5 seconds
setInterval(() => {
  let changed = false;

  queues = queues.map((queue) => {
    const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const newSize = Math.max(0, Math.min(queue.maxSize, queue.currentSize + delta));
    if (newSize !== queue.currentSize) {
      changed = true;
      const updated = { ...queue, currentSize: newSize, waitMinutes: calculateWaitTime(newSize) };
      updateQueueStatus(updated);
      return updated;
    }
    return queue;
  });

  if (changed) {
    io.emit('queue:update', { queues });
  }
}, 5000);

// Simulate heatmap density changes every 8 seconds
setInterval(() => {
  heatmapZones = heatmapZones.map((zone) => {
    if (zone.sectionId === 's5') return zone; // Field doesn't change
    const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
    const newDensity = Math.max(10, Math.min(99, zone.density + delta));
    return {
      ...zone,
      density: newDensity,
      level: newDensity >= 80 ? 'high' : newDensity >= 50 ? 'medium' : 'low',
    } as HeatmapZone;
  });

  io.emit('heatmap:update', { heatmap: heatmapZones });
}, 8000);

// Simulate alert generation every 30 seconds
setInterval(() => {
  const highZones = heatmapZones.filter((z) => z.level === 'high');
  if (highZones.length > 0 && Math.random() > 0.5) {
    const zone = highZones[Math.floor(Math.random() * highZones.length)];
    const newAlert: Alert = {
      id: uuidv4(),
      type: zone.density > 90 ? 'critical' : 'warning',
      message: `${zone.density > 90 ? 'Critical' : 'High'} crowd density in ${zone.name} (${zone.density}%)`,
      section: zone.name,
      timestamp: new Date().toISOString(),
    };
    activeAlerts = [newAlert, ...activeAlerts.slice(0, 9)]; // Keep newest alert plus 9 previous (10 total)
    io.emit('alert:new', { alert: newAlert, alerts: activeAlerts });
  }
}, 30000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateWaitTime(size: number): number {
  return Math.max(1, Math.round(size * 0.8));
}

function updateQueueStatus(queue: Queue): void {
  const ratio = queue.currentSize / queue.maxSize;
  queue.status = ratio >= 0.7 ? 'high' : ratio >= 0.4 ? 'medium' : 'low';
}

// ─── Start Server ─────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`🚀 Smart Venue Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`📊 REST API endpoints available`);
});
