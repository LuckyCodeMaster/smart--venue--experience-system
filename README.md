# 🏟️ Smart Venue Experience System (SVES)

[![CI](https://github.com/your-org/smart--venue--experience-system/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/smart--venue--experience-system/actions/workflows/ci.yml)
[![Deploy](https://github.com/your-org/smart--venue--experience-system/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/smart--venue--experience-system/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%20LTS-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)

An IoT and mobile-based platform that optimizes crowd movement, reduces waiting times, and enhances real-time coordination for large-scale sporting and entertainment venues.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎟️ **Virtual Queue Management** | Join queues digitally, track position in real time, receive push notifications when your turn is near |
| 🗺️ **Indoor Navigation** | Turn-by-turn wayfinding within venues using GPS + BLE beacon fusion |
| 📡 **IoT Sensor Integration** | Real-time occupancy, temperature, and air-quality monitoring from hardware sensors |
| 📱 **Mobile App (React Native)** | Cross-platform iOS and Android app with offline-capable Redux state |
| 🌐 **Web Dashboard** | Staff and admin dashboard built with React and Vite |
| ⚡ **Real-Time Updates** | WebSocket (Socket.IO) push for queue changes, sensor readings, and navigation alerts |
| ♿ **Accessibility Mode** | Accessible route calculation and UI accommodations |

---

## 🏗️ Architecture Overview

```
Mobile App (React Native)
Web Frontend (React + Vite)
         │ HTTPS / WSS
         ▼
  Backend API (Node.js + Express)
    ├── REST API  (/api/...)
    └── WebSocket (Socket.IO)
         │
    ┌────┴────┐
    │         │
PostgreSQL  Redis
(data)   (cache + pub/sub)
         ▲
    IoT Sensors (BLE beacons, occupancy sensors)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a full breakdown.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 18 LTS](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) with Compose v2

### Run with Docker Compose

```bash
# 1. Clone
git clone https://github.com/your-org/smart--venue--experience-system.git
cd smart--venue--experience-system

# 2. Configure environment
cp .env.example .env
# Edit .env and set JWT_SECRET, PG_PASSWORD, etc.

# 3. Start all services
docker compose up

# 4. Open in browser
open http://localhost        # Frontend
# API available at http://localhost:3000/api
```

For manual setup without Docker, see [docs/SETUP.md](docs/SETUP.md).

---

## 📱 Mobile App

```bash
cd mobile
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [docs/API.md](docs/API.md) | REST API and WebSocket event reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and component breakdown |
| [docs/SETUP.md](docs/SETUP.md) | Developer setup guide |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

---

## 🗂️ Repository Structure

```
.
├── backend/          # Node.js / Express API server
├── frontend/         # React + Vite web dashboard
├── mobile/           # React Native mobile app
├── docs/             # Documentation
├── .github/
│   └── workflows/    # CI/CD GitHub Actions
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🧪 Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Mobile
cd mobile && npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our development process, branching strategy, and code style guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a Pull Request against `develop`

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🔒 Security

If you discover a security vulnerability, please report it via [GitHub Security Advisories](https://github.com/your-org/smart--venue--experience-system/security/advisories) rather than opening a public issue.
