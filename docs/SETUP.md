# SVES Developer Setup Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 LTS+ | Use [nvm](https://github.com/nvm-sh/nvm) for version management |
| npm | 9+ | Comes with Node 18 |
| Docker Desktop | 24+ | For local services (Postgres, Redis) |
| Docker Compose | v2 | Included with Docker Desktop |
| Git | 2.40+ | |

**Mobile development (optional):**

| Tool | Notes |
|------|-------|
| Xcode 15+ | macOS only, required for iOS simulator |
| Android Studio | Required for Android emulator |
| React Native CLI | `npm install -g react-native-cli` |
| CocoaPods | `sudo gem install cocoapods` (macOS) |

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/smart--venue--experience-system.git
cd smart--venue--experience-system
```

---

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and update the values, paying particular attention to:

- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `JWT_REFRESH_SECRET` — generate a second random secret
- `PG_PASSWORD` / `REDIS_PASSWORD` — choose strong passwords
- Leave `SENSOR_API_KEY_HASH` empty for now (configure when adding IoT devices)

---

## 3. Local Development with Docker Compose

This is the recommended approach — all services start with a single command.

```bash
# Start all services (Postgres, Redis, backend, frontend)
docker compose up

# Start in detached mode
docker compose up -d

# View logs for a specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes (reset all data)
docker compose down -v
```

Services will be available at:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:3000/api |
| Backend WebSocket | ws://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 4. Manual Setup (Without Docker)

If you prefer to run services directly on your machine:

### 4a. Install and start PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15
createdb sves_db

# Ubuntu/Debian
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb sves_db
sudo -u postgres createuser sves --pwprompt
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sves_db TO sves;"
```

### 4b. Install and start Redis

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server
```

### 4c. Install backend dependencies

```bash
cd backend
npm install
```

### 4d. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## 5. Database Setup and Migrations

```bash
cd backend

# Run all pending migrations
npm run migrate

# Seed development data (optional)
npm run seed

# Rollback the last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

---

## 6. Running Services Manually

```bash
# Terminal 1 — Backend (with hot reload)
cd backend && npm run dev

# Terminal 2 — Frontend (Vite dev server)
cd frontend && npm run dev
```

---

## 7. Mobile App Setup

```bash
cd mobile
npm install

# iOS (macOS only)
cd ios && pod install && cd ..
npx react-native run-ios

# Android (requires Android emulator or device)
npx react-native run-android
```

**Android emulator note:** The API base URL in `mobile/src/services/api.ts` uses `10.0.2.2` in development (`__DEV__`), which maps to localhost on the host machine from within the Android emulator.

---

## 8. Running Tests

```bash
# Backend tests (with coverage)
cd backend && npm test

# Backend tests in watch mode
cd backend && npm run test:watch

# Frontend tests
cd frontend && npm test

# Mobile tests
cd mobile && npm test

# Run all tests from root
npm run test --workspaces
```

---

## 9. Linting and Type Checking

```bash
# Lint backend
cd backend && npm run lint

# Lint and auto-fix backend
cd backend && npm run lint:fix

# Type-check backend
cd backend && npx tsc --noEmit

# Lint frontend
cd frontend && npm run lint

# Type-check mobile
cd mobile && npm run type-check
```

---

## 10. IDE Setup Recommendations

### VS Code

Install these extensions:

- **ESLint** — `dbaeumer.vscode-eslint`
- **Prettier** — `esbenp.prettier-vscode`
- **TypeScript** — built-in, ensure TS version is 5+
- **REST Client** — `humao.rest-client` (test APIs from `.http` files)
- **Docker** — `ms-azuretools.vscode-docker`
- **GitLens** — `eamodio.gitlens`

Recommended `settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### JetBrains WebStorm / IntelliJ

- Enable ESLint integration: Settings → Languages → JavaScript → Code Quality Tools → ESLint → Automatic
- Enable Prettier: Settings → Languages → JavaScript → Prettier → Run on save

---

## 11. Common Issues

### Port already in use

```bash
# Find what's using port 3000
lsof -i :3000
kill -9 <PID>
```

### Docker volume permission issues (Linux)

```bash
sudo chown -R $USER:$USER ./backend ./frontend
```

### PostgreSQL connection refused

Ensure the `DATABASE_URL` in `.env` matches your local Postgres configuration. If using Docker Compose, the host should be `postgres` (the service name), not `localhost`.

### Node modules out of date after pulling

```bash
cd backend && npm install
cd ../frontend && npm install
```

### iOS build fails: pod install errors

```bash
cd mobile/ios
pod deintegrate && pod install
```
