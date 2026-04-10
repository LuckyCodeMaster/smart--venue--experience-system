# SVES API Documentation

> **Version:** 1.0.0  
> **Base URL:** `https://api.sves.example.com/api`  
> **Authentication:** Bearer JWT (access token in `Authorization` header)

---

## Table of Contents

- [Authentication](#authentication)
- [Venues](#venues)
- [Queues](#queues)
- [Navigation](#navigation)
- [Sensors](#sensors)
- [Health](#health)
- [WebSocket Events](#websocket-events)

---

## Authentication

### POST /api/auth/register

Register a new user account.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "visitor"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "visitor",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": 1705318200000
    }
  }
}
```

**Errors:** `400 Bad Request` (validation), `409 Conflict` (email taken)

---

### POST /api/auth/login

Authenticate and receive tokens.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "usr_abc123", "email": "user@example.com", "firstName": "Jane", "lastName": "Smith", "role": "visitor" },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": 1705318200000
    }
  }
}
```

**Errors:** `401 Unauthorized` (invalid credentials), `400 Bad Request`

---

### POST /api/auth/logout

Invalidate the current refresh token.

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
{ "success": true, "message": "Logged out successfully." }
```

---

### POST /api/auth/refresh

Exchange a refresh token for a new token pair.

**Request body:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": 1705318200000
  }
}
```

**Errors:** `401 Unauthorized` (expired/invalid refresh token)

---

### GET /api/auth/me

Get the currently authenticated user.

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "visitor",
    "preferences": {
      "notifications": true,
      "locationSharing": true,
      "accessibilityMode": false,
      "language": "en",
      "theme": "system"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Venues

### GET /api/venues

List all venues. Supports filtering and pagination.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | `open\|closed\|limited` | Filter by status |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Results per page (default: 20, max: 100) |
| `lat` | `number` | Latitude for proximity sort |
| `lng` | `number` | Longitude for proximity sort |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "venue_001",
      "name": "Grand Arena",
      "description": "Multi-purpose sports and entertainment venue",
      "address": "1 Arena Blvd, San Francisco, CA 94105",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "capacity": 20000,
      "currentOccupancy": 14500,
      "status": "open",
      "operatingHours": { "monday": { "open": "09:00", "close": "23:00", "isClosed": false } },
      "amenities": [{ "id": "am_001", "type": "restroom", "name": "Main Restrooms", "floor": 0, "isAccessible": true, "status": "available" }]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

---

### POST /api/venues

Create a new venue. **Requires `admin` role.**

**Request body:**
```json
{
  "name": "Grand Arena",
  "description": "Multi-purpose sports and entertainment venue",
  "address": "1 Arena Blvd, San Francisco, CA 94105",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "capacity": 20000,
  "operatingHours": { "monday": { "open": "09:00", "close": "23:00", "isClosed": false } }
}
```

**Response `201 Created`:** Full venue object.

---

### GET /api/venues/:id

Get a single venue by ID.

**Response `200 OK`:** Full venue object including floors and zones.

**Errors:** `404 Not Found`

---

### PUT /api/venues/:id

Update a venue. **Requires `admin` role.**

**Request body:** Any subset of venue fields.

**Response `200 OK`:** Updated venue object.

---

### DELETE /api/venues/:id

Delete a venue. **Requires `admin` role.**

**Response `204 No Content`**

---

## Queues

### GET /api/queues

List queues. Filter by venue.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `venueId` | `string` | Filter by venue (required) |
| `status` | `active\|paused\|closed` | Filter by queue status |
| `type` | `attraction\|food\|service\|entry` | Filter by type |

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "q_001",
      "venueId": "venue_001",
      "name": "Main Stage Entry",
      "description": "Queue for main stage area entry",
      "type": "entry",
      "status": "active",
      "currentLength": 85,
      "estimatedWaitMinutes": 18,
      "maxCapacity": 200,
      "createdAt": "2024-01-15T18:00:00Z",
      "updatedAt": "2024-01-15T18:45:00Z"
    }
  ]
}
```

---

### POST /api/queues

Create a queue. **Requires `staff` or `admin` role.**

**Request body:**
```json
{
  "venueId": "venue_001",
  "name": "VIP Entry",
  "description": "Dedicated VIP access queue",
  "type": "entry",
  "maxCapacity": 50
}
```

**Response `201 Created`:** Full queue object.

---

### GET /api/queues/:id

Get queue details including real-time stats.

**Response `200 OK`:** Full queue object.

---

### PUT /api/queues/:id

Update queue (status, capacity, etc.). **Requires `staff` or `admin` role.**

---

### POST /api/queues/:id/join

Join a queue as the authenticated user.

**Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "queueId": "q_001",
    "userId": "usr_abc123",
    "position": 86,
    "estimatedWaitMinutes": 18,
    "joinedAt": "2024-01-15T18:47:00Z",
    "notificationSent": false
  }
}
```

**Errors:** `409 Conflict` (already in queue), `400 Bad Request` (queue full or closed)

---

### DELETE /api/queues/:id/leave

Leave a queue.

**Response `200 OK`:**
```json
{ "success": true, "message": "You have left the queue." }
```

---

### GET /api/queues/:id/status

Get current queue status (lightweight endpoint for polling).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "queueId": "q_001",
    "status": "active",
    "currentLength": 85,
    "estimatedWaitMinutes": 18,
    "userPosition": 86,
    "userEstimatedWaitMinutes": 18
  }
}
```

---

## Navigation

### POST /api/navigation/route

Calculate a navigation route within a venue.

**Request body:**
```json
{
  "venueId": "venue_001",
  "startPoint": { "latitude": 37.7749, "longitude": -122.4194 },
  "endPoint": { "latitude": 37.7752, "longitude": -122.4191 },
  "isAccessible": false
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "route_xyz",
    "venueId": "venue_001",
    "startPoint": { "latitude": 37.7749, "longitude": -122.4194 },
    "endPoint": { "latitude": 37.7752, "longitude": -122.4191 },
    "totalDistanceMeters": 180,
    "estimatedDurationSeconds": 150,
    "isAccessible": false,
    "steps": [
      {
        "stepNumber": 1,
        "instruction": "Head north through the main entrance",
        "distanceMeters": 30,
        "bearing": 0,
        "landmark": "Ticket Gate A",
        "floor": 0,
        "coordinate": { "latitude": 37.77495, "longitude": -122.4194 }
      }
    ]
  }
}
```

---

### GET /api/navigation/map/:venueId

Get floor map data for a venue.

**Query parameters:** `floor` (number, default: 0)

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "venueId": "venue_001",
    "floor": 0,
    "mapUrl": "https://cdn.sves.example.com/maps/venue_001_floor0.svg",
    "zones": [{ "id": "zone_001", "name": "Main Concourse", "type": "general" }]
  }
}
```

---

### GET /api/navigation/amenities

List nearby amenities.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `venueId` | `string` | Required |
| `lat` | `number` | User latitude |
| `lng` | `number` | User longitude |
| `radius` | `number` | Search radius in metres (default: 100) |
| `type` | `string` | Filter by amenity type |

**Response `200 OK`:** Array of `Amenity` objects.

---

### POST /api/navigation/congestion

Report crowd congestion in a zone.

**Request body:**
```json
{
  "zoneId": "zone_001",
  "level": "high"
}
```

**Response `200 OK`:**
```json
{ "success": true, "message": "Congestion reported. Route updates will propagate via WebSocket." }
```

---

## Sensors

### POST /api/sensors/ingest

Ingest a sensor reading from an IoT device.

**Authentication:** `X-Sensor-API-Key: <raw_key>` (validated against `SENSOR_API_KEY_HASH`)

**Request body:**
```json
{
  "sensorId": "sensor_entrance_01",
  "type": "occupancy",
  "value": 85,
  "unit": "percent",
  "timestamp": "2024-01-15T18:45:00Z",
  "venueId": "venue_001",
  "zoneId": "zone_001"
}
```

**Response `202 Accepted`:**
```json
{ "success": true, "message": "Sensor reading accepted." }
```

---

### GET /api/sensors/:sensorId/status

Get the latest status of a sensor.

**Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "sensorId": "sensor_entrance_01",
    "type": "occupancy",
    "value": 85,
    "unit": "percent",
    "timestamp": "2024-01-15T18:45:00Z",
    "status": "online",
    "venueId": "venue_001",
    "zoneId": "zone_001"
  }
}
```

---

### GET /api/sensors/:sensorId/history

Get historical readings for a sensor.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `from` | `ISO8601` | Start date/time |
| `to` | `ISO8601` | End date/time |
| `limit` | `number` | Max records (default: 100) |

**Response `200 OK`:** Array of sensor readings ordered by timestamp descending.

---

## Health

### GET /api/health

Health check endpoint. No authentication required.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T18:45:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "uptime": 86400
}
```

---

## WebSocket Events

Connect to the WebSocket server at `wss://api.sves.example.com` with the access token:

```
wss://api.sves.example.com?token=<accessToken>
```

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe_queue` | `{ queueId: string }` | Subscribe to queue updates |
| `unsubscribe_queue` | `{ queueId: string }` | Unsubscribe from queue |
| `subscribe_venue` | `{ venueId: string }` | Subscribe to venue-level events |

### Server → Client

#### `queue_updated`
Fired when queue state changes.
```json
{
  "event": "queue_updated",
  "data": {
    "queueId": "q_001",
    "currentLength": 84,
    "estimatedWaitMinutes": 17,
    "status": "active",
    "updatedAt": "2024-01-15T18:46:00Z"
  }
}
```

#### `sensor_reading`
New sensor reading ingested.
```json
{
  "event": "sensor_reading",
  "data": {
    "sensorId": "sensor_entrance_01",
    "type": "occupancy",
    "value": 87,
    "unit": "percent",
    "venueId": "venue_001",
    "zoneId": "zone_001",
    "timestamp": "2024-01-15T18:46:00Z"
  }
}
```

#### `occupancy_update`
Venue or zone occupancy has changed.
```json
{
  "event": "occupancy_update",
  "data": {
    "venueId": "venue_001",
    "zoneId": "zone_001",
    "currentOccupancy": 14600,
    "capacity": 20000,
    "percent": 73,
    "timestamp": "2024-01-15T18:46:00Z"
  }
}
```

#### `navigation_alert`
Congestion or route change detected.
```json
{
  "event": "navigation_alert",
  "data": {
    "venueId": "venue_001",
    "zoneId": "zone_001",
    "alertType": "congestion",
    "level": "high",
    "message": "Heavy congestion near Gate B. Alternative routes recommended.",
    "affectedRoutes": ["route_xyz"],
    "timestamp": "2024-01-15T18:47:00Z"
  }
}
```

#### `queue_position_update`
User's position in a queue has changed (sent only to the relevant user).
```json
{
  "event": "queue_position_update",
  "data": {
    "queueId": "q_001",
    "userId": "usr_abc123",
    "position": 5,
    "estimatedWaitMinutes": 2,
    "message": "Almost your turn!"
  }
}
```
