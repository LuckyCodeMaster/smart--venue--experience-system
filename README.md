<div align="center">

# 🏟️ Smart Venue Experience System

### *Real-time crowd management, virtual queues, and venue analytics*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Try_Now-blue?style=for-the-badge)](https://sves-demo.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/LuckyCodeMaster/smart--venue--experience-system)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Built for Google Prompt Wars Hackathon** 🎯

---

## ✨ [👉 Try the Live Demo →](https://sves-demo.vercel.app)

> Open in your browser — no installation required!

</div>

---

## 📱 Quick Access

| Method | Link | Description |
|--------|------|-------------|
| 🌐 **Web App** | [sves-demo.vercel.app](https://sves-demo.vercel.app) | Works on any device, any browser |
| 📱 **Mobile** | Scan QR below | Opens in Expo Go on iOS/Android |
| 💻 **Local** | `docker-compose up` | Run everything locally |

```
█████████████████████████████████
█████████████████████████████████
████ ▄▄▄▄▄ █▀▀▄█  ▄▀█ ▄▄▄▄▄ ████
████ █   █ █▀▀▄ ▀▄ ██ █   █ ████
████ █▄▄▄█ █ ▄ ▀▄▄▄██ █▄▄▄█ ████
████▄▄▄▄▄▄▄█ █ ▀ █ ▀ █▄▄▄▄▄▄▄████
████  ▀▀▄▀▄▀▄▄▄█ ▀█▄  ▀▀ ▄█  ████
████▄▄█▀▀▀▄▀ ▄▄▀▄▀ ▀▀▄▄▄▄██  ████
████ ▄▄▄▄▄ █▄▄▄ ▀▄  █▀  ▄ █▄ ████
████ █   █ █  █▄█▀ ▄█ ▀██▀  ████
████ █▄▄▄█ █ ▀▄ ▀▄▀▄▄▀ ▄▀▄▄ ████
████▄▄▄▄▄▄▄█▄▄▄██▄▄▄▄█▄██▄▄▄████
█████████████████████████████████

QR Code → https://sves-demo.vercel.app
```

---

## 🎯 What It Does

The **Smart Venue Experience System (SVES)** is a real-time platform for large-scale event venues that:

- 📊 **Monitors crowd density** across all venue sections with live heatmaps
- 🕐 **Manages virtual queues** — attendees join from their phone, no physical lines
- 📡 **Streams live updates** via WebSocket so all screens update instantly
- 🛡️ **Empowers staff** with an operations dashboard showing bottlenecks and analytics
- 📱 **Works on any device** — mobile-first responsive design

---

## 🖼️ Screenshots

### Attendee View — Join queues, see crowd density
```
┌─────────────────────────────────┐
│  🏟️ Smart Venue  [🎟️][🛡️][ℹ️]   │
├─────────────────────────────────┤
│ Grand Arena            2,347    │
│ ████████████████░░░░   of 5,000 │
├─────────────────────────────────┤
│ 🗺️ Venue Heatmap                │
│ ┌──────────┐  ┌──────────┐      │
│ │Main Stage│  │Food Court│      │
│ │🔴 Crowded│  │🟠 Busy   │      │
│ └──────────┘  └──────────┘      │
├─────────────────────────────────┤
│ 🕐 Virtual Queues               │
│ Main Stage Entry  8m wait       │
│ ██████░░░░   [Join Queue]       │
└─────────────────────────────────┘
```

### Staff Dashboard — Real-time operations center
```
┌─────────────────────────────────┐
│  👥 2,347  📊 47%  ⏱️ 9m  👮 45 │
├─────────────────────────────────┤
│ 📈 Hourly Attendance            │
│     ██                         │
│   ████                         │
│ ████████                       │
│ 10 11 12 13 14 15 16 17 18     │
├─────────────────────────────────┤
│ 🚦 Queue Status                 │
│ Main Stage Entry  8m ████░░    │
│ Food Court       12m ██████░   │
│ VIP Check-in      3m ██░░░░    │
└─────────────────────────────────┘
```

---

## 🚀 Getting Started

### Option 1: Live Web Demo (Instant)
```
Visit: https://sves-demo.vercel.app
```
No setup required. Works immediately in any browser.

### Option 2: Local with Docker (One Command)
```bash
git clone https://github.com/LuckyCodeMaster/smart--venue--experience-system
cd smart--venue--experience-system
docker-compose up
```
Then open: http://localhost:3000

### Option 3: Manual Setup
```bash
# Backend
cd backend
npm install
npm start       # → http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
REACT_APP_BACKEND_URL=http://localhost:5000 npm start  # → http://localhost:3000
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Smart Venue Experience System        │
├──────────────┬──────────────────┬────────────────┤
│   Frontend   │     Backend      │   Deployment   │
│  React App   │  Express + WS    │                │
│  Tailwind    │  REST + WebSocket│  Vercel (FE)   │
│  3 Views:    │  In-memory data  │  Render (BE)   │
│  - Attendee  │  Real-time sim   │  Docker (local)│
│  - Staff     │                  │                │
│  - Info      │  /api/venue      │                │
│              │  /api/queues     │                │
│              │  /api/analytics  │                │
│              │  POST /queue/join│                │
│              │  WS /ws          │                │
└──────────────┴──────────────────┴────────────────┘
```

---

## 📦 Project Structure

```
smart--venue--experience-system/
├── frontend/                 # React app (deployed to Vercel)
│   ├── src/
│   │   ├── App.js           # Main app with all views
│   │   └── index.css        # Tailwind styles
│   ├── vercel.json          # Vercel config (frontend-level)
│   └── Dockerfile           # Container config
├── backend/                  # Express API (deployed to Render)
│   ├── src/
│   │   └── server.js        # All-in-one API server
│   ├── Procfile             # Heroku/Railway deployment
│   └── Dockerfile           # Container config
├── vercel.json              # Root-level Vercel config (monorepo)
├── DEPLOYMENT.md            # Step-by-step deployment guide
├── docker-compose.yml        # Local full-stack setup
├── render.yaml              # Render deployment config
└── .github/
    └── workflows/
        └── ci.yml           # CI/CD pipeline
```

---

## 🌐 Deployment

For a detailed, step-by-step deployment walkthrough see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

### Quick summary

| Service | Platform | Key setting |
|---------|----------|-------------|
| Frontend | [Vercel](https://vercel.com) | Deploy from repo root — `vercel.json` points Vercel at `./frontend` automatically |
| Backend | [Render](https://render.com) | Root Directory → `backend` |

**Required environment variable (Vercel):** `REACT_APP_BACKEND_URL=https://your-backend.onrender.com`

---

## 🎬 Demo Guide for Judges

### 3-Minute Demo Script

**1. Attendee Experience (1 minute)**
- Open [sves-demo.vercel.app](https://sves-demo.vercel.app)
- See the grand arena occupancy (2,347 / 5,000)
- View the color-coded heatmap — red sections are crowded
- Scroll to Virtual Queues — tap "Join Queue" on any entry
- See real-time position and wait time update

**2. Staff Dashboard (1 minute)**
- Tap "🛡️ Staff" in the top navigation
- See live statistics: visitors, capacity %, avg wait time, staff on duty
- View the hourly attendance bar chart
- See all queue statuses with visual capacity bars
- Note the bottleneck alerts (highlighted in red)

**3. Real-Time Updates (1 minute)**
- Open the app on two devices simultaneously
- Join a queue on one device
- Watch the queue length update live on both screens
- See the heatmap colors shift as occupancy changes every 5 seconds

---

## ✅ Features Checklist

| Feature | Status |
|---------|--------|
| Live web app | ✅ Deployed on Vercel |
| Real-time WebSocket updates | ✅ Every 5 seconds |
| Virtual queue management | ✅ Join/leave queues |
| Crowd density heatmap | ✅ Color-coded sections |
| Staff operations dashboard | ✅ Full analytics view |
| Mobile responsive design | ✅ Mobile-first |
| Docker Compose local setup | ✅ One-command deploy |
| CI/CD pipeline | ✅ GitHub Actions |
| In-memory data (no DB needed) | ✅ Zero setup |
| Demo mode (works offline) | ✅ Fallback data |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS v3 |
| Backend | Node.js 20, Express 4, ws |
| Real-time | WebSocket (native ws library) |
| Styling | Tailwind CSS (utility-first) |
| Deployment | Vercel (FE) + Render (BE) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 📋 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/venue` | GET | Venue info & section data |
| `/api/queues` | GET | All queue statuses |
| `/api/analytics` | GET | Analytics & statistics |
| `/api/design/tokens` | GET | Design system tokens + sync payloads |
| `/api/design/theme` | GET | Active dark glassmorphism theme config |
| `/api/design/theme/preview` | POST | Preview theme payload for integrations |
| `/api/queue/join` | POST | Join a queue |
| `/api/queue/leave` | POST | Leave a queue |
| `/ws` | WebSocket | Real-time updates (`INIT`, `UPDATE`, `THEME_UPDATE`) |

---

<div align="center">

**Built with ❤️ for Google Prompt Wars Hackathon**

[🚀 Try Live Demo](https://sves-demo.vercel.app) | [⭐ Star on GitHub](https://github.com/LuckyCodeMaster/smart--venue--experience-system)

</div>
