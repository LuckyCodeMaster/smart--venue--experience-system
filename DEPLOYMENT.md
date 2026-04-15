# Deployment Guide

This guide walks you through deploying the Smart Venue Experience System (SVES) to Vercel (frontend) and Render (backend).

---

## Table of Contents

1. [Overview](#overview)
2. [Deploy the Backend to Render](#deploy-the-backend-to-render)
3. [Deploy the Frontend to Vercel](#deploy-the-frontend-to-vercel)
4. [Environment Variables](#environment-variables)
5. [Verify the Deployment](#verify-the-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Overview

```
GitHub Repository (monorepo)
├── frontend/   → deployed to Vercel
└── backend/    → deployed to Render
```

The root-level `vercel.json` tells Vercel to build and serve the React app from the `./frontend` subdirectory, so **no manual Root Directory setting** is required in the Vercel dashboard.

---

## Deploy the Backend to Render

Deploy the backend **first** so you have a URL to give to the frontend.

1. Go to [render.com](https://render.com) and sign in (GitHub login is easiest).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select this repository.
4. Fill in the service settings:
   | Field | Value |
   |-------|-------|
   | **Name** | `sves-backend` (or any name you like) |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
5. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `PORT` | `10000` |
   | `ALLOWED_ORIGINS` | *(leave blank for now; add your Vercel URL after frontend is deployed)* |
6. Click **Create Web Service**. Render will build and start the backend automatically.
7. **Copy the service URL** — it looks like `https://sves-backend-xxxx.onrender.com`. You will need it in the next step.

---

## Deploy the Frontend to Vercel

### Option A — Import via Vercel Dashboard (recommended for first-time setup)

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).
2. Click **Add New…** → **Project**.
3. Find and import this repository (`smart--venue--experience-system`).
4. On the **Configure Project** screen:
   - **Framework Preset** — leave as *Other* (the root `vercel.json` handles everything).
   - **Root Directory** — leave as `/` (repo root). The `vercel.json` already points builds at `./frontend`.
   - Do **not** change the build or output settings — they are read from `vercel.json`.
5. Under **Environment Variables**, add:
   | Name | Value |
   |------|-------|
   | `REACT_APP_BACKEND_URL` | `https://sves-backend-xxxx.onrender.com` *(your Render URL)* |
6. Click **Deploy**. Vercel will install, build, and publish the frontend.
7. **Copy the deployment URL** (e.g. `https://sves-demo.vercel.app`).

### Option B — Vercel CLI

```bash
# Install the CLI once
npm install -g vercel

# From the repository root
vercel

# Follow the prompts:
#   Set up and deploy? → Y
#   Link to existing project? → N (first time) or Y (re-deploy)
#   Project name → sves-frontend (or any name)
#   Directory → . (use root; vercel.json handles the rest)
#   Override settings? → N

# Set the required environment variable
vercel env add REACT_APP_BACKEND_URL production
# Paste your Render backend URL when prompted

# Promote to production
vercel --prod
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `REACT_APP_BACKEND_URL` | Vercel (frontend) | Full URL of the deployed backend, e.g. `https://sves-backend-xxxx.onrender.com` |
| `PORT` | Render (backend) | Port the Express server listens on (Render sets this automatically, but you can override) |
| `ALLOWED_ORIGINS` | Render (backend) | Comma-separated list of allowed frontend origins, e.g. `https://sves-demo.vercel.app` |

> **Important:** `REACT_APP_BACKEND_URL` must be set **before** the Vercel build runs. If you add or change it after deployment, trigger a redeploy from the Vercel dashboard (Deployments → ⋯ → Redeploy).

---

## Verify the Deployment

1. Open your Vercel URL (e.g. `https://sves-demo.vercel.app`).
2. The Smart Venue Experience System home screen should load.
3. Open your browser DevTools → **Console**. You should see a WebSocket connection to your Render backend and live data updating every 5 seconds.
4. Tap **🛡️ Staff** to check the analytics dashboard.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `DEPLOYMENT_NOT_FOUND` on the Vercel URL | No successful deployment exists yet | Check the Deployments tab in the Vercel dashboard; look for build errors |
| Blank page / `Cannot GET /` | Build output directory wrong | Ensure `vercel.json` at the repo root is present and sets `"outputDirectory": "frontend/build"` |
| `npm ERR! Cannot find package.json` | Wrong root directory | The root `vercel.json` uses `cd frontend && …` commands; do not override the root directory in the dashboard |
| Frontend loads but shows no live data | Backend URL not set | Add `REACT_APP_BACKEND_URL` to Vercel environment variables and redeploy |
| CORS errors in the browser console | Backend not accepting the frontend origin | Add your Vercel URL to `ALLOWED_ORIGINS` on Render and redeploy the backend |
| Backend sleeps after inactivity (Render free tier) | Free tier limitation | First request after idle may take ~30 seconds; upgrade to a paid Render plan to avoid cold starts |
