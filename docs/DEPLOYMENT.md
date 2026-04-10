# SVES Deployment Guide

## Production Deployment Overview

SVES is containerised and designed to run on any OCI-compatible container platform. The recommended setup uses Docker Compose for single-node deployments or Kubernetes for high-availability.

```
                    ┌─────────────────────────────────┐
                    │          CloudFlare CDN          │
                    └────────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │       nginx Reverse Proxy        │
                    │  (SSL termination, rate limiting)│
                    └────────┬──────────────┬─────────┘
                             │              │
               ┌─────────────▼──┐    ┌──────▼────────────┐
               │  Frontend      │    │  Backend API       │
               │  (nginx serve) │    │  (Node.js cluster) │
               └────────────────┘    └──────┬────────────┘
                                            │
                             ┌──────────────┴──────────┐
                             │                         │
               ┌─────────────▼──┐          ┌──────────▼─────────┐
               │  PostgreSQL 15 │          │     Redis 7         │
               │  (managed RDS) │          │  (managed ElastiCache)│
               └────────────────┘          └────────────────────┘
```

---

## Docker Deployment

### Production Docker Compose

For single-server production deployments:

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env with production values

# 2. Pull latest images
docker compose -f docker-compose.yml pull

# 3. Start services
docker compose up -d

# 4. Check service health
docker compose ps
docker compose logs --tail=100 backend
```

### Building Production Images Manually

```bash
# Build backend production image
docker build \
  --target production \
  --tag ghcr.io/your-org/sves-backend:latest \
  ./backend

# Build frontend production image
docker build \
  --target production \
  --build-arg VITE_API_URL=https://api.sves.example.com/api \
  --build-arg VITE_WS_URL=wss://api.sves.example.com \
  --tag ghcr.io/your-org/sves-frontend:latest \
  ./frontend

# Push to registry
docker push ghcr.io/your-org/sves-backend:latest
docker push ghcr.io/your-org/sves-frontend:latest
```

---

## Environment Configuration

### Required Secrets (never commit to source control)

| Variable | Description | How to Generate |
|----------|-------------|-----------------|
| `JWT_SECRET` | JWT signing key | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Refresh token key | `openssl rand -hex 32` |
| `PG_PASSWORD` | Database password | Strong random password |
| `REDIS_PASSWORD` | Redis auth password | Strong random password |
| `SENSOR_API_KEY_HASH` | SHA-256 of IoT API key | `echo -n "key" \| sha256sum` |

### nginx Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name api.sves.example.com;

    ssl_certificate /etc/ssl/certs/sves.crt;
    ssl_certificate_key /etc/ssl/private/sves.key;

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name sves.example.com;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Database Setup

### Initial Production Setup

```bash
# Run migrations on first deploy
docker exec sves_backend npm run migrate

# Optional: seed initial admin user
docker exec sves_backend npm run seed:admin
```

### Backup Strategy

```bash
# Daily backup (add to cron)
docker exec sves_postgres pg_dump \
  -U $PG_USER \
  -d $PG_DATABASE \
  --format=custom \
  --file=/backups/sves_$(date +%Y%m%d_%H%M%S).dump

# Restore from backup
pg_restore \
  -U $PG_USER \
  -d $PG_DATABASE \
  --clean \
  sves_backup.dump
```

---

## Scaling Considerations

### Horizontal Scaling (Backend)

The backend is stateless — all shared state is in Redis and PostgreSQL. Scale horizontally with a load balancer:

```yaml
# In docker-compose.yml or Kubernetes deployment
replicas: 3
```

Ensure `REDIS_URL` is configured so all instances share the same Redis instance for pub/sub.

### Database Read Replicas

For high-read workloads (sensor data history, analytics):

1. Configure a PostgreSQL read replica
2. Route read-only queries to the replica
3. Keep writes on the primary

### Redis Cluster

For very high throughput (10,000+ concurrent users), consider Redis Cluster mode. Update `REDIS_URL` to point to the cluster endpoint.

---

## Monitoring Setup

### Health Check Endpoint

The backend exposes `GET /api/health` — configure your load balancer or orchestrator to check this endpoint every 10 seconds with a 5-second timeout.

### Recommended Monitoring Stack

| Tool | Purpose |
|------|---------|
| **Prometheus** | Metrics collection |
| **Grafana** | Metrics dashboards |
| **Loki** | Log aggregation |
| **Alertmanager** | Alert routing |

### Key Metrics to Monitor

- `http_request_duration_seconds` — API latency (p50, p95, p99)
- `queue_length` — active queue sizes
- `websocket_connections` — concurrent WebSocket clients
- `sensor_ingest_rate` — IoT events per second
- PostgreSQL connection pool utilisation
- Redis memory usage

### Log Levels

Set `LOG_LEVEL=info` for production. Use `warn` if log volume is too high. Never use `debug` in production.

---

## CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/`) automates the following:

### CI (`ci.yml`) — triggers on every push/PR

1. **Lint** — ESLint on backend and frontend
2. **Test Backend** — Jest tests with real Postgres and Redis service containers
3. **Test Frontend** — Vitest/Jest tests with coverage
4. **Build Backend** — TypeScript compile + Docker image build (no push)
5. **Build Frontend** — Vite production build + Docker image build (no push)

### Deploy (`deploy.yml`) — triggers on push to `main`

1. **Build & Push Backend** — Docker build → push to `ghcr.io` with `sha-<commit>` and `latest` tags
2. **Build & Push Frontend** — Same, with production env vars baked in
3. **Deploy** — Placeholder step; replace with your deployment method:
   - SSH + `docker compose pull && docker compose up -d`
   - `kubectl set image`
   - Render/Fly.io/Railway webhook

### Required GitHub Secrets

| Secret | Used In |
|--------|---------|
| `GITHUB_TOKEN` | Auto-provided — push to GHCR |
| `VITE_API_URL` | Build-time frontend env |
| `VITE_WS_URL` | Build-time frontend env |
| `PRODUCTION_URL` | Environment URL display |

---

## Rolling Updates (Zero Downtime)

```bash
# Pull new images
docker compose pull

# Recreate containers one at a time (with load balancer)
docker compose up -d --no-deps --scale backend=2 backend
# Wait for new containers to be healthy
docker compose up -d --no-deps --scale backend=1 backend

# Or use Docker's built-in update:
docker compose up -d backend
```

---

## Rollback Procedure

```bash
# List available backend image tags
docker images ghcr.io/your-org/sves-backend

# Roll back to a specific commit SHA
docker compose stop backend
docker tag ghcr.io/your-org/sves-backend:sha-<previous-sha> ghcr.io/your-org/sves-backend:latest
docker compose up -d backend

# If database migrations need rolling back:
docker exec sves_backend npm run migrate:rollback
```
