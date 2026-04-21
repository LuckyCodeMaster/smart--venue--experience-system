const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const themeUpdateToken = process.env.THEME_UPDATE_TOKEN;
const THEME_UPDATE_RATE_LIMIT_MS = Number(process.env.THEME_UPDATE_RATE_LIMIT_MS) || 1000;
const wsThemeUpdateTimestamps = new WeakMap();

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Middleware
// ALLOWED_ORIGINS: comma-separated list of allowed frontend origins.
// In production, set this env var (e.g. "https://sves-demo.vercel.app").
// Omitting it in development falls back to localhost + the Vercel demo URL.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:3000',
      'https://sves-demo.vercel.app',
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development or demo mode, allow any origin
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
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

// ── Design system (dark glassmorphism) ─────────────────────────────────────────

const designTokens = {
  colors: {
    primary: {
      gradientFrom: '#7c3aed',
      gradientTo: '#a78bfa'
    },
    accent: {
      cyan: '#00d4ff',
      pink: '#ff006e'
    },
    background: {
      base: '#0a0a1a',
      surface: '#1a1a2e'
    },
    semantic: {
      danger: '#ef4444',
      warning: '#f97316',
      success: '#22c55e',
      info: '#3b82f6'
    }
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
    },
    fontWeight: {
      normal: 400,
      semibold: 600,
      bold: 700,
      black: 900
    }
  },
  spacing: {
    baseUnit: '4px',
    scale: {
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
      12: '3rem',
      16: '4rem'
    }
  },
  effects: {
    blur: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px'
    },
    shadow: {
      glass: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 32px rgba(0,0,0,0.45)',
      neon: '0 0 24px rgba(0,212,255,0.35)'
    }
  },
  motion: {
    animations: ['float', 'pulse-ring', 'shimmer', 'slide-up', 'glow'],
    transitions: {
      fast: '150ms ease-out',
      normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '400ms ease-in-out'
    }
  }
};

const themes = {
  'dark-glassmorphism': {
    id: 'dark-glassmorphism',
    name: 'Dark Glassmorphism',
    mode: 'dark',
    colors: {
      pageBackground: '#0a0a1a',
      panelBackground: 'rgba(26, 26, 46, 0.72)',
      panelBorder: 'rgba(255, 255, 255, 0.12)',
      primaryGradient: ['#7c3aed', '#a78bfa'],
      neonAccent: ['#00d4ff', '#ff006e']
    },
    typography: {
      fontFamily: designTokens.typography.fontFamily.sans,
      presets: {
        title: { size: '24px', weight: 700 },
        subtitle: { size: '20px', weight: 600 },
        body: { size: '16px', weight: 400 },
        caption: { size: '12px', weight: 400 }
      }
    },
    components: {
      card: {
        backdropBlur: designTokens.effects.blur.lg,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        shadow: designTokens.effects.shadow.glass
      },
      button: {
        primaryGradient: ['#7c3aed', '#a78bfa'],
        accentGlow: designTokens.effects.shadow.neon,
        textColor: '#f8fafc'
      },
      gradient: {
        heroOverlay: 'radial-gradient(circle at top right, rgba(167,139,250,0.35), transparent 55%)',
        baseLayer: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)'
      }
    }
  },
  'dark-glassmorphism-neon': {
    id: 'dark-glassmorphism-neon',
    name: 'Dark Glassmorphism Neon',
    mode: 'dark',
    colors: {
      pageBackground: '#070716',
      panelBackground: 'rgba(20, 20, 40, 0.78)',
      panelBorder: 'rgba(0, 212, 255, 0.28)',
      primaryGradient: ['#00d4ff', '#ff006e'],
      neonAccent: ['#7c3aed', '#a78bfa']
    },
    typography: {
      fontFamily: designTokens.typography.fontFamily.sans,
      presets: {
        title: { size: '24px', weight: 700 },
        subtitle: { size: '20px', weight: 600 },
        body: { size: '16px', weight: 400 },
        caption: { size: '12px', weight: 400 }
      }
    },
    components: {
      card: {
        backdropBlur: designTokens.effects.blur.lg,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(0,212,255,0.2)',
        shadow: designTokens.effects.shadow.glass
      },
      button: {
        primaryGradient: ['#00d4ff', '#ff006e'],
        accentGlow: designTokens.effects.shadow.neon,
        textColor: '#f8fafc'
      },
      gradient: {
        heroOverlay: 'radial-gradient(circle at top right, rgba(0,212,255,0.25), transparent 55%)',
        baseLayer: 'linear-gradient(180deg, #070716 0%, #141428 100%)'
      }
    }
  }
};

let activeThemeId = 'dark-glassmorphism';

function getActiveTheme() {
  return themes[activeThemeId];
}

function mapTailwindConfigValues(tokens, theme) {
  return {
    colors: {
      'bg-dark': tokens.colors.background.base,
      'bg-surface': tokens.colors.background.surface,
      'primary-500': tokens.colors.primary.gradientFrom,
      'primary-400': tokens.colors.primary.gradientTo,
      'accent-cyan': tokens.colors.accent.cyan,
      'accent-pink': tokens.colors.accent.pink
    },
    spacing: tokens.spacing.scale,
    blur: tokens.effects.blur,
    fontFamily: {
      sans: theme.typography.fontFamily
    },
    animationNames: tokens.motion.animations
  };
}

function exportTokensForMobile(tokens, theme) {
  return {
    themeId: theme.id,
    colors: {
      background: tokens.colors.background.base,
      surface: tokens.colors.background.surface,
      primaryGradient: theme.colors.primaryGradient,
      neonAccent: theme.colors.neonAccent
    },
    spacing: tokens.spacing.scale,
    typography: theme.typography.presets,
    effects: tokens.effects,
    motion: tokens.motion
  };
}

function validateDesignSystemConsistency(tokens, theme) {
  const checks = [
    { name: 'primary gradient defined', valid: Array.isArray(theme.colors.primaryGradient) && theme.colors.primaryGradient.length === 2 },
    { name: 'neon accents defined', valid: Array.isArray(theme.colors.neonAccent) && theme.colors.neonAccent.length === 2 },
    { name: 'typography presets exist', valid: Boolean(theme.typography && theme.typography.presets && theme.typography.presets.body) },
    { name: 'blur tokens available', valid: Boolean(tokens.effects && tokens.effects.blur && tokens.effects.blur.md) }
  ];

  return {
    isConsistent: checks.every(check => check.valid),
    checks
  };
}

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

function broadcastMessage(message) {
  const payload = JSON.stringify({
    ...message,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('WebSocket broadcast failed:', err.message);
      }
    }
  });
}

function broadcastUpdate() {
  broadcastMessage({
    type: 'UPDATE',
    venue: venueData,
    queues,
    analytics,
    theme: getActiveTheme(),
    metadata: {
      activeTheme: activeThemeId,
      availableThemes: Object.keys(themes)
    }
  });
}

function broadcastThemeUpdate(source = 'api') {
  broadcastMessage({
    type: 'THEME_UPDATE',
    source,
    theme: getActiveTheme(),
    metadata: {
      activeTheme: activeThemeId,
      availableThemes: Object.keys(themes)
    }
  });
}

wss.on('connection', ws => {
  wsThemeUpdateTimestamps.set(ws, 0);

  // Send initial state on connect
  ws.send(JSON.stringify({
    type: 'INIT',
    venue: venueData,
    queues,
    analytics,
    theme: getActiveTheme(),
    metadata: {
      activeTheme: activeThemeId,
      availableThemes: Object.keys(themes)
    },
    timestamp: new Date().toISOString()
  }));

  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type !== 'THEME_UPDATE') {
        ws.send(JSON.stringify({
          type: 'WS_MESSAGE_IGNORED',
          reason: 'Unsupported message type',
          timestamp: new Date().toISOString()
        }));
        return;
      }

      const now = Date.now();
      const lastThemeUpdateAt = wsThemeUpdateTimestamps.get(ws) || 0;
      if (now - lastThemeUpdateAt < THEME_UPDATE_RATE_LIMIT_MS) {
        ws.send(JSON.stringify({
          type: 'THEME_UPDATE_RESULT',
          success: false,
          error: 'Theme updates are rate limited',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      wsThemeUpdateTimestamps.set(ws, now);

      const nodeEnv = process.env.NODE_ENV || 'development';
      const allowUnauthenticatedThemeUpdates = nodeEnv === 'development' || nodeEnv === 'test';
      if (!themeUpdateToken && !allowUnauthenticatedThemeUpdates) {
        ws.send(JSON.stringify({
          type: 'THEME_UPDATE_RESULT',
          success: false,
          error: 'Theme updates are disabled until THEME_UPDATE_TOKEN is configured',
          timestamp: new Date().toISOString()
        }));
        return;
      }

      if (themeUpdateToken) {
        const providedToken = typeof parsed.authToken === 'string' ? parsed.authToken : '';
        const expectedToken = themeUpdateToken;
        const tokenMatches = providedToken.length === expectedToken.length &&
          crypto.timingSafeEqual(Buffer.from(providedToken), Buffer.from(expectedToken));

        if (!tokenMatches) {
          ws.send(JSON.stringify({
            type: 'THEME_UPDATE_RESULT',
            success: false,
            error: 'Unauthorized theme update request',
            timestamp: new Date().toISOString()
          }));
          return;
        }
      }

      const requestedThemeId = parsed.themeId;
      if (!requestedThemeId || !themes[requestedThemeId]) {
        ws.send(JSON.stringify({
          type: 'THEME_UPDATE_RESULT',
          success: false,
          error: 'Invalid themeId',
          availableThemes: Object.keys(themes),
          timestamp: new Date().toISOString()
        }));
        return;
      }

      if (requestedThemeId === activeThemeId) {
        ws.send(JSON.stringify({
          type: 'THEME_UPDATE_RESULT',
          success: true,
          theme: getActiveTheme(),
          metadata: {
            activeTheme: activeThemeId,
            availableThemes: Object.keys(themes)
          },
          timestamp: new Date().toISOString()
        }));
        return;
      }

      activeThemeId = requestedThemeId;
      ws.send(JSON.stringify({
        type: 'THEME_UPDATE_RESULT',
        success: true,
        theme: getActiveTheme(),
        metadata: {
          activeTheme: activeThemeId,
          availableThemes: Object.keys(themes)
        },
        timestamp: new Date().toISOString()
      }));
      broadcastThemeUpdate('ws');
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'THEME_UPDATE_RESULT',
        success: false,
        error: 'Invalid message payload',
        detail: err.message,
        timestamp: new Date().toISOString()
      }));
    }
  });

  ws.on('error', () => {});
});

// ── REST endpoints ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/venue', (_req, res) => res.json(venueData));

app.get('/api/queues', (_req, res) => res.json(queues));

app.get('/api/analytics', (_req, res) => res.json(analytics));

app.get('/api/design/tokens', (_req, res) => {
  const activeTheme = getActiveTheme();
  res.json({
    activeTheme: activeThemeId,
    tokens: designTokens,
    sync: {
      tailwind: mapTailwindConfigValues(designTokens, activeTheme),
      mobile: exportTokensForMobile(designTokens, activeTheme),
      validation: validateDesignSystemConsistency(designTokens, activeTheme)
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/design/theme', (_req, res) => {
  const activeTheme = getActiveTheme();
  res.json({
    activeTheme: activeThemeId,
    theme: activeTheme,
    validation: validateDesignSystemConsistency(designTokens, activeTheme),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/design/theme/preview', (req, res) => {
  const { themeId } = req.body || {};
  if (themeId && !themes[themeId]) {
    return res.status(400).json({
      error: 'Invalid themeId',
      availableThemes: Object.keys(themes),
      activeTheme: activeThemeId,
      timestamp: new Date().toISOString()
    });
  }

  const previewTheme = themeId ? themes[themeId] : getActiveTheme();

  res.json({
    activeTheme: activeThemeId,
    previewTheme,
    sync: {
      tailwind: mapTailwindConfigValues(designTokens, previewTheme),
      mobile: exportTokensForMobile(designTokens, previewTheme),
      validation: validateDesignSystemConsistency(designTokens, previewTheme)
    },
    timestamp: new Date().toISOString()
  });
});

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
// PORT: defaults to 5000. Set via environment variable in production.
// Example: PORT=8080 node src/server.js

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SVES Backend running on port ${PORT}`);
});

module.exports = { app, server };
