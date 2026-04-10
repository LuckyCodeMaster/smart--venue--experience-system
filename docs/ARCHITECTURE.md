# SVES Architecture Documentation

## System Overview

The **Smart Venue Experience System (SVES)** is a full-stack platform that enables real-time management of large venue experiences through:

- **Queue management** — virtual queuing with real-time position tracking
- **Indoor navigation** — turn-by-turn wayfinding within venues
- **IoT integration** — occupancy and environment sensors
- **Mobile-first UX** — React Native app for visitors

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│  ┌────────────────┐  ┌─────────────────────────────┐   │
│  │  React Native  │  │     React Web Frontend       │   │
│  │  Mobile App    │  │  (Vite + Redux Toolkit)      │   │
│  └───────┬────────┘  └─────────────┬───────────────┘   │
└──────────┼──────────────────────────┼───────────────────┘
           │ HTTPS / WSS              │ HTTPS / WSS
┌──────────▼──────────────────────────▼───────────────────┐
│                    API Gateway / Load Balancer           │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  Backend (Node.js / Express)             │
│  Routes → Controllers → Services → Models → DB          │
│  + WebSocket Server (Socket.IO)                         │
└────────┬────────────────────────────────────┬───────────┘
         │                                    │
┌────────▼────────┐                 ┌─────────▼──────────┐
│   PostgreSQL 15 │                 │    Redis 7          │
│  (primary store)│                 │  (cache, pub/sub,   │
└─────────────────┘                 │   session store)    │
                                    └────────────────────┘
         ▲
         │ IoT sensor ingest
┌────────┴─────────────────────────┐
│  IoT Devices / BLE Beacons       │
│  (occupancy, temp, air quality)  │
└──────────────────────────────────┘
```

---

## Backend Architecture

The backend follows a **layered architecture**:

```
src/
├── routes/          # Express route definitions — URL mapping only
├── controllers/     # Request parsing, response shaping, error handling
├── services/        # Business logic — the core of the application
├── models/          # Database entity definitions (ORM models)
├── middleware/      # Auth, rate limiting, logging, error handling
├── websocket/       # Socket.IO event handlers and room management
├── config/          # Configuration loading and validation
└── utils/           # Shared helpers and utilities
```

### Request Flow

```
HTTP Request
     │
     ▼
Rate Limiter Middleware
     │
     ▼
Auth Middleware (JWT verification)
     │
     ▼
Route Handler (routes/)
     │
     ▼
Controller (controllers/)  ← validates input, calls services
     │
     ▼
Service Layer (services/)  ← business logic, orchestration
     │
     ├──▶ Model / DB (PostgreSQL via ORM)
     │
     └──▶ Cache / PubSub (Redis)
               │
               ▼
         WebSocket emit (Socket.IO)
               │
               ▼
         Connected clients receive real-time updates
```

### Key Services

| Service | Responsibility |
|---------|---------------|
| `AuthService` | JWT issuance, refresh, blacklisting |
| `QueueService` | Virtual queue management, position calculations |
| `NavigationService` | Route calculation, congestion-aware pathfinding |
| `SensorService` | IoT data ingestion, aggregation, alerting |
| `VenueService` | Venue CRUD, occupancy tracking |
| `NotificationService` | Push notifications via FCM/APNS |

---

## Frontend Architecture (React Web)

```
src/
├── components/       # Reusable UI components
├── pages/            # Route-level page components
├── store/            # Redux Toolkit store and slices
│   ├── slices/       # Feature-specific state slices
│   └── index.ts      # Store configuration
├── services/         # API client and WebSocket client
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── utils/            # Formatting, validation helpers
```

### Redux Data Flow

```
User Action
     │
     ▼
dispatch(thunk)          ← createAsyncThunk
     │
     ▼
API Service (axios)      ← JWT attached automatically
     │
     ▼
Backend API
     │
     ▼
Redux State Update       ← fulfilled/rejected cases
     │
     ▼
React Re-render          ← useAppSelector
```

---

## Mobile Architecture (React Native)

```
mobile/src/
├── navigation/        # React Navigation stack and tab definitions
├── screens/           # Full-screen views
├── components/        # Shared UI components
├── store/             # Same Redux pattern as web frontend
├── services/
│   ├── api.ts         # Axios instance with JWT + refresh logic
│   ├── locationService.ts    # Geolocation wrapper
│   ├── notificationService.ts # Push notification setup
│   └── bleService.ts  # BLE beacon scanning (Phase 1: mock)
└── types/             # TypeScript interfaces
```

### Navigation Structure

```
AppNavigator (RootStack)
├── SplashScreen          ← shown during auth initialization
├── AuthNavigator (AuthStack)
│   └── LoginScreen
└── MainNavigator (MainStack)
    ├── HomeTabs (BottomTab)
    │   ├── HomeScreen
    │   ├── QueueScreen
    │   ├── MapScreen
    │   └── SettingsScreen
    ├── NavigationScreen
    ├── QueueDetail
    └── ProfileScreen
```

---

## Real-Time Communication (WebSocket)

SVES uses **Socket.IO** for bidirectional real-time communication.

### Room Strategy

| Room | Members | Events |
|------|---------|--------|
| `venue:{venueId}` | All users in a venue | `occupancy_update`, `navigation_alert` |
| `queue:{queueId}` | Users subscribed to a queue | `queue_updated` |
| `user:{userId}` | Single user | `queue_position_update` |

### Pub/Sub via Redis

When multiple backend instances run in production, Redis pub/sub ensures events emitted by one instance reach clients connected to other instances:

```
Instance A handles sensor ingest
     │
     ▼
Redis PUBLISH "sensor:venue_001"
     │
     ├──▶ Instance A subscribers → Socket.IO emit
     └──▶ Instance B subscribers → Socket.IO emit
```

---

## IoT Data Pipeline

```
IoT Sensor Device
     │  POST /api/sensors/ingest
     │  Header: X-Sensor-API-Key: <key>
     ▼
Sensor Controller
     │  validates API key hash
     ▼
SensorService.ingest()
     ├──▶ Write to PostgreSQL (sensor_readings table)
     ├──▶ Update zone/venue occupancy aggregate
     ├──▶ Redis PUBLISH occupancy update
     └──▶ Check alert thresholds → trigger NavigationService reroute
```

---

## Database Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts, roles, preferences |
| `venues` | Venue metadata, capacity, hours |
| `venue_floors` | Per-floor map data |
| `zones` | Areas within floors (capacity, coordinates) |
| `amenities` | Venue facilities (restrooms, food, etc.) |
| `queues` | Queue definitions per venue |
| `queue_entries` | Active user queue positions |
| `sensor_readings` | Time-series IoT sensor data |
| `navigation_routes` | Cached computed routes |
| `refresh_tokens` | JWT refresh token store (with expiry) |

### Key Relationships

```
venues ─┬─< venue_floors ─< zones ─< sensor_readings
        ├─< amenities
        └─< queues ─< queue_entries >─ users
```

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT (RS256 or HS256), short-lived access (15m) + long-lived refresh (7d) |
| Authorization | Role-based (`visitor`, `staff`, `admin`) enforced in middleware |
| IoT API | API key hashed with SHA-256, key never stored in plaintext |
| Transport | HTTPS/WSS enforced; HSTS headers |
| Rate Limiting | Per-IP and per-user limits via Redis sliding window |
| Input Validation | Zod schemas on all request bodies |
| SQL Injection | ORM parameterised queries only |
| CORS | Strict origin whitelist from `CORS_ORIGIN` env |

---

## Deployment Architecture

```
Internet
   │
   ▼
CDN (static assets, SSL termination)
   │
   ▼
Load Balancer (nginx / cloud LB)
   │
   ├──▶ Frontend containers (nginx serving React build)
   │
   └──▶ Backend containers (Node.js, multiple replicas)
              │
              ├──▶ PostgreSQL (managed DB service or RDS)
              └──▶ Redis (managed Redis or ElastiCache)
```

### Scaling Strategy

- **Backend:** Stateless Node.js processes scale horizontally; Redis handles shared state
- **WebSocket:** Socket.IO adapter for Redis enables multi-instance WebSocket
- **Database:** Read replicas for analytics/reporting queries
- **Sensors:** Dedicated `/api/sensors/ingest` endpoint behind separate rate limits
