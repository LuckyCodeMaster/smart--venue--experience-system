# 🏟️ Smart Venue Experience System

> **Google Prompt Wars Hackathon MVP** — Real-time venue navigation, virtual queue management, and crowd density analytics for large-scale sporting events.

[![Made with React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)](https://socket.io)

---

## ✨ Features

- **📍 Attendee View** — Interactive venue map, real-time queue status, one-tap queue joining
- **📊 Staff Dashboard** — Live crowd density heatmap, active alerts, queue overview, KPIs
- **ℹ️ Info Screen** — Venue info, concessions, facilities, transport
- **⚡ Real-Time Updates** — WebSocket sync across all clients (queues + heatmap + alerts)
- **🌙 Dark / Light Theme** — Toggle with a single tap
- **📱 Mobile-First PWA** — Works offline, installable on phone

---

## 🚀 Quick Start (5 minutes)

### Option 1 — Docker (Recommended)

```bash
git clone https://github.com/LuckyCodeMaster/smart--venue--experience-system.git
cd smart--venue--experience-system
docker-compose up
```

Open **http://localhost:3000** in your browser. That's it! 🎉

### Option 2 — Local Development

**Backend:**
```bash
cd backend
npm install
npm run dev     # Starts on http://localhost:5000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:3000
```

---

## 🗂️ Project Structure

```
smart-venue-experience-system/
├── frontend/                   # React + TypeScript + Tailwind CSS (Vite)
│   └── src/
│       ├── App.tsx             # Root component + theme toggle
│       ├── pages/
│       │   ├── AttendeeView.tsx    # Map + queue join
│       │   ├── StaffDashboard.tsx  # Heatmap + alerts
│       │   └── InfoScreen.tsx      # Venue info + tabs
│       ├── components/
│       │   ├── VenueMap.tsx    # SVG venue map
│       │   ├── QueueStatus.tsx # Queue cards with join button
│       │   ├── Heatmap.tsx     # Density heatmap
│       │   └── Navigation.tsx  # Bottom nav bar
│       └── hooks/
│           └── useSocket.ts    # WebSocket integration
├── backend/                    # Node.js + Express + Socket.io
│   └── src/
│       ├── server.ts           # All REST endpoints + WebSocket
│       └── mock-data.ts        # Pre-generated realistic data
├── docker-compose.yml          # One-command deployment
├── .env.example                # Environment variables template
└── README.md
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/venue` | Venue info + sections + facilities |
| GET | `/api/queues` | All queue statuses |
| GET | `/api/map` | Map sections + facility positions |
| POST | `/api/queue/join` | Join a virtual queue |
| GET | `/api/queue/status/:id` | Check your queue position |
| GET | `/api/analytics` | Crowd analytics for dashboard |
| GET | `/api/heatmap` | Heatmap density data |
| GET | `/api/alerts` | Active staff alerts |
| WS | `/socket.io` | Real-time push updates |

### Example: Join a Queue

```bash
curl -X POST http://localhost:5000/api/queue/join \
  -H "Content-Type: application/json" \
  -d '{"queueId": "q1", "userId": "my-user-id"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "memberId": "my-user-id",
    "position": 9,
    "estimatedWait": 7,
    "message": "Joined Restroom - North A queue at position #9"
  }
}
```

---

## 🎬 Demo Scenario (3 minutes)

1. **Open Attendee View** — explore the interactive venue map
2. **Join a queue** — tap "Join Queue" on any facility card
3. **Watch real-time updates** — queue sizes change every 5 seconds automatically
4. **Switch to Operations** — see the live crowd heatmap change colors
5. **Check Alerts** — staff alerts auto-generate when density spikes
6. **Open Info tab** — browse concessions, facilities, and transport

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (utility-first) |
| Real-time | Socket.io (WebSocket) |
| Backend | Express.js + TypeScript |
| Mock Data | In-memory store (no DB needed) |
| Deployment | Docker + Docker Compose |

---

## 🎨 Design Principles

- **Google Material Design** aesthetic — clean, modern, familiar
- **48px minimum touch targets** — fully accessible on mobile
- **WCAG AA** contrast compliance
- **Smooth animations** — slide-up, fade-in, progress bars
- **Zero configuration** — pre-loaded with realistic mock data

---

## 📄 License

MIT License — built for Google Prompt Wars Hackathon 2026

