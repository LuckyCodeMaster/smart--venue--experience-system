import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';

// ── Constants ───────────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const WS_URL = (BACKEND_URL.replace(/^http/, 'ws')) + '/ws';

// ── Initial demo data (used when WS is not connected) ──────────────────────────
const DEMO_VENUE = {
  name: 'Grand Arena',
  capacity: 5000,
  currentOccupancy: 2347,
  sections: [
    { id: 'A', name: 'Main Stage', capacity: 1500, occupancy: 892, color: '#ef4444', gradient: 'from-red-500 to-rose-600' },
    { id: 'B', name: 'Food Court', capacity: 800,  occupancy: 634, color: '#f97316', gradient: 'from-orange-500 to-amber-500' },
    { id: 'C', name: 'Exhibition Hall', capacity: 1200, occupancy: 421, color: '#22c55e', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'D', name: 'VIP Lounge', capacity: 300, occupancy: 187, color: '#a855f7', gradient: 'from-purple-500 to-violet-600' },
    { id: 'E', name: 'East Wing', capacity: 700, occupancy: 156, color: '#06b6d4', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'F', name: 'West Wing', capacity: 500, occupancy: 57, color: '#10b981', gradient: 'from-teal-500 to-emerald-400' },
  ],
  facilities: [
    { id: 1, name: 'Restrooms', icon: '🚻', location: 'Multiple locations', status: 'Available', statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { id: 2, name: 'First Aid', icon: '🏥', location: 'Main entrance, Section C', status: 'Staffed', statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { id: 3, name: 'Info Desk', icon: 'ℹ️', location: 'Main lobby', status: 'Open', statusColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
    { id: 4, name: 'Parking', icon: '🅿️', location: 'North & South lots', status: '60% Full', statusColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
    { id: 5, name: 'ATM', icon: '💳', location: 'Food court entrance', status: 'Available', statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { id: 6, name: 'WiFi', icon: '📶', location: 'Venue-wide', status: 'Active', statusColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  ],
};

const DEMO_QUEUES = [
  { id: 1, name: 'Main Stage Entry', location: 'Gate A', waitTime: 8, length: 34, maxLength: 100, status: 'open', icon: '🎸' },
  { id: 2, name: 'Food Court', location: 'Section B', waitTime: 12, length: 56, maxLength: 80, status: 'open', icon: '🍔' },
  { id: 3, name: 'VIP Check-in', location: 'Gate D', waitTime: 3, length: 8, maxLength: 30, status: 'open', icon: '👑' },
  { id: 4, name: 'Merchandise', location: 'Main lobby', waitTime: 15, length: 72, maxLength: 100, status: 'open', icon: '🛍️' },
  { id: 5, name: 'Exhibition Entry', location: 'Gate C', waitTime: 5, length: 21, maxLength: 60, status: 'open', icon: '🎨' },
];

const DEMO_ANALYTICS = {
  avgWaitTime: 9,
  bottlenecks: ['Food Court', 'Main Stage Entry'],
  satisfactionScore: 4.2,
  eventsToday: 3,
  staffOnDuty: 45,
  incidentsReported: 2,
  incidentsResolved: 2,
  hourlyOccupancy: [
    { hour: '10am', count: 320 },
    { hour: '11am', count: 780 },
    { hour: '12pm', count: 1250 },
    { hour: '1pm', count: 1890 },
    { hour: '2pm', count: 2540 },
    { hour: '3pm', count: 2890 },
    { hour: '4pm', count: 2347 },
    { hour: '5pm', count: 2100 },
    { hour: '6pm', count: 1870 },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────────
function occupancyPercent(section) {
  return Math.round((section.occupancy / section.capacity) * 100);
}

function crowdLabel(pct) {
  if (pct >= 80) return { label: 'Crowded', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' };
  if (pct >= 50) return { label: 'Busy', cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' };
  return { label: 'Clear', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' };
}

function queueColor(pct) {
  if (pct > 80) return { bar: 'linear-gradient(90deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.4)' };
  if (pct > 50) return { bar: 'linear-gradient(90deg,#f97316,#ea580c)', glow: 'rgba(249,115,22,0.4)' };
  return { bar: 'linear-gradient(90deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.4)' };
}

// ── Floating orbs background ─────────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-float"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 animate-float-delay"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
    </div>
  );
}

// ── NavBar ───────────────────────────────────────────────────────────────────────
function NavBar({ view, setView, connected }) {
  const tabs = [
    { id: 'attendee', label: 'Attendee', icon: '🎟️' },
    { id: 'staff', label: 'Staff', icon: '🛡️' },
    { id: 'info', label: 'Info', icon: 'ℹ️' },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-white/10"
      style={{ background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
            🏟️
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-white text-sm tracking-tight leading-none">SMART VENUE</h1>
            <p className="text-xs font-medium" style={{ color: '#a78bfa' }}>Experience System</p>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                view === t.id
                  ? 'text-white shadow-lg'
                  : 'text-white/50 hover:text-white/80'
              }`}
              style={view === t.id ? {
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
              } : {}}
            >
              <span className="sm:hidden">{t.icon}</span>
              <span className="hidden sm:inline">{t.icon} {t.label}</span>
            </button>
          ))}
        </nav>

        {/* Live indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {connected ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <div className="live-dot w-2 h-2" />
              <span className="text-xs font-semibold text-emerald-400 hidden sm:block">LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-xs font-semibold text-white/30 hidden sm:block">DEMO</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Animated stat card ────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, gradient, glow }) {
  return (
    <div className="card group cursor-default animate-slide-up">
      <div className="flex flex-col h-full">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{ background: gradient, boxShadow: `0 4px 16px ${glow}` }}>
          {icon}
        </div>
        <div className="stat-value text-white">{value}</div>
        <div className="text-xs font-medium text-white/40 mt-1">{label}</div>
      </div>
    </div>
  );
}

// ── Occupancy ring ───────────────────────────────────────────────────────────────
function OccupancyRing({ pct, size = 80 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct > 80 ? '#ef4444' : pct > 60 ? '#f97316' : '#a855f7';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s ease', filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-sm font-black text-white">{pct}%</div>
      </div>
    </div>
  );
}

// ── Section heatmap ───────────────────────────────────────────────────────────────
function SectionHeatmap({ sections }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>🗺️</span>
          Venue Heatmap
        </h3>
        <span className="text-xs font-medium text-white/30 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
          Live density
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sections.map(sec => {
          const pct = occupancyPercent(sec);
          const crowd = crowdLabel(pct);
          return (
            <div key={sec.id}
              className="rounded-xl p-3 border border-white/10 transition-all duration-300 hover:border-white/20 hover:scale-[1.02] cursor-default"
              style={{ background: `linear-gradient(135deg, ${sec.color}15, ${sec.color}05)` }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-white">{sec.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{sec.occupancy}/{sec.capacity}</div>
                </div>
                <span className={`badge text-xs ${crowd.cls}`}>{crowd.label}</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${sec.color}, ${sec.color}cc)`,
                    boxShadow: `0 0 8px ${sec.color}60`,
                  }} />
              </div>
              <div className="text-right text-xs font-bold mt-1" style={{ color: sec.color }}>{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Queue card ─────────────────────────────────────────────────────────────────────
function QueueCard({ queue, joinedId, onJoin, onLeave }) {
  const isJoined = joinedId === queue.id;
  const pct = Math.round((queue.length / queue.maxLength) * 100);
  const colors = queueColor(pct);

  return (
    <div className={`card transition-all duration-300 animate-slide-up ${
      isJoined ? 'border-purple-500/40' : ''
    }`}
      style={isJoined ? { boxShadow: '0 8px 32px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)' } : {}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            {queue.icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{queue.name}</h3>
            <p className="text-xs text-white/40">{queue.location}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-black text-gradient leading-none">{queue.waitTime}m</div>
          <div className="text-xs text-white/30 mt-0.5">wait time</div>
        </div>
      </div>

      <div className="mt-3 progress-track">
        <div className="progress-fill"
          style={{
            width: `${pct}%`,
            background: colors.bar,
            boxShadow: `0 0 8px ${colors.glow}`,
          }} />
      </div>
      <div className="flex justify-between text-xs text-white/30 mt-1 font-medium">
        <span>{queue.length} in queue</span>
        <span>max {queue.maxLength}</span>
      </div>

      <div className="mt-4">
        {isJoined ? (
          <div className="flex gap-2">
            <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-purple-300 border border-purple-500/30"
              style={{ background: 'rgba(139,92,246,0.1)' }}>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Position #{queue.length} · You're in!
            </div>
            <button onClick={() => onLeave(queue.id)} className="btn-secondary text-sm px-4">
              Leave
            </button>
          </div>
        ) : (
          <button
            onClick={() => onJoin(queue.id)}
            disabled={!!joinedId}
            className="btn-primary w-full"
          >
            Join Queue
          </button>
        )}
      </div>
    </div>
  );
}

// ── Attendee View ───────────────────────────────────────────────────────────────────
function AttendeeView({ venue, queues, connected }) {
  const [joinedQueueId, setJoinedQueueId] = useState(null);
  const [visitorId] = useState(() => `visitor-${Date.now()}`);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleJoin = useCallback(async (queueId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, visitorId }),
      });
      if (res.ok) {
        setJoinedQueueId(queueId);
        const data = await res.json();
        showNotif(`✅ Joined queue! Wait: ~${data.queue.waitTime} min`);
      } else {
        setJoinedQueueId(queueId);
        showNotif('✅ Joined queue! (demo mode)');
      }
    } catch {
      setJoinedQueueId(queueId);
      showNotif('✅ Joined queue! (demo mode)');
    }
  }, [visitorId]);

  const handleLeave = useCallback(async (queueId) => {
    try {
      await fetch(`${BACKEND_URL}/api/queue/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, visitorId }),
      });
    } catch { /* ignore */ }
    setJoinedQueueId(null);
    showNotif('👋 Left the queue', 'info');
  }, [visitorId]);

  const totalPct = Math.round((venue.currentOccupancy / venue.capacity) * 100);

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up px-6 py-3 rounded-2xl text-sm font-semibold text-white shadow-2xl border border-white/20"
          style={{ background: 'rgba(10,10,26,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {notification.msg}
        </div>
      )}

      {/* Venue hero card */}
      <div className="rounded-2xl p-5 sm:p-6 overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #6d28d9)',
          boxShadow: '0 20px 60px rgba(124,58,237,0.4)',
        }}>
        {/* Decorative background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

        <div className="relative flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏟️</span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{venue.name}</h2>
            </div>
            <p className="text-purple-200 text-sm font-medium">
              {connected ? '🟢 Live venue status' : '🔵 Demo mode'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <OccupancyRing pct={totalPct} size={72} />
          </div>
        </div>

        <div className="relative mt-4">
          <div className="flex justify-between text-xs font-semibold text-purple-200 mb-1.5">
            <span>Occupancy</span>
            <span>{venue.currentOccupancy.toLocaleString()} / {venue.capacity.toLocaleString()}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${totalPct}%`,
                background: 'linear-gradient(90deg, #c4b5fd, #ffffff)',
                boxShadow: '0 0 12px rgba(255,255,255,0.5)',
              }} />
          </div>
        </div>

        {/* Mini stats row */}
        <div className="relative mt-4 grid grid-cols-3 gap-3">
          {[
            { value: `${totalPct}%`, label: 'Capacity' },
            { value: '9m', label: 'Avg Wait' },
            { value: '4.2⭐', label: 'Rating' },
          ].map(s => (
            <div key={s.label} className="text-center px-2 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="text-base font-black text-white">{s.value}</div>
              <div className="text-xs text-purple-200">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <SectionHeatmap sections={venue.sections} />

      {/* Queues header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>🕐</span>
          Virtual Queues
        </h3>
        <span className="text-xs font-medium text-white/30 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
          {joinedQueueId ? '✅ In a queue' : 'Tap to join'}
        </span>
      </div>

      {queues.map(q => (
        <QueueCard
          key={q.id}
          queue={q}
          joinedId={joinedQueueId}
          onJoin={handleJoin}
          onLeave={handleLeave}
          visitorId={visitorId}
        />
      ))}
    </div>
  );
}

// ── Gradient bar chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="flex items-end gap-1.5 h-28 px-1">
      {data.map((d, i) => {
        const h = Math.round((d.count / max) * 100);
        const isHighest = d.count === max;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full rounded-t-lg transition-all duration-700 hover:opacity-90"
              style={{
                height: `${h}%`,
                background: isHighest
                  ? 'linear-gradient(180deg,#a855f7,#7c3aed)'
                  : 'linear-gradient(180deg,#6d28d9,#4c1d95)',
                boxShadow: isHighest ? '0 0 12px rgba(168,85,247,0.5)' : 'none',
              }}>
              {isHighest && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-purple-400 whitespace-nowrap">
                  Peak
                </div>
              )}
            </div>
            <span className="text-white/30 font-medium whitespace-nowrap" style={{ fontSize: '9px' }}>{d.hour}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Staff View ──────────────────────────────────────────────────────────────────
function StaffView({ venue, queues, analytics }) {
  const totalPct = Math.round((venue.currentOccupancy / venue.capacity) * 100);

  const primaryStats = [
    {
      value: venue.currentOccupancy.toLocaleString(),
      label: 'Current Visitors',
      icon: '👥',
      gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
      glow: 'rgba(59,130,246,0.5)',
    },
    {
      value: `${totalPct}%`,
      label: 'Capacity Used',
      icon: '📊',
      gradient: totalPct > 80
        ? 'linear-gradient(135deg,#ef4444,#dc2626)'
        : totalPct > 60
        ? 'linear-gradient(135deg,#f97316,#ea580c)'
        : 'linear-gradient(135deg,#10b981,#059669)',
      glow: totalPct > 80 ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)',
    },
    {
      value: `${analytics.avgWaitTime}m`,
      label: 'Avg Wait Time',
      icon: '⏱️',
      gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)',
      glow: 'rgba(168,85,247,0.5)',
    },
    {
      value: analytics.staffOnDuty,
      label: 'Staff On Duty',
      icon: '👮',
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      glow: 'rgba(16,185,129,0.5)',
    },
  ];

  const secondaryStats = [
    {
      value: analytics.eventsToday,
      label: 'Events Today',
      icon: '🎪',
      gradient: 'linear-gradient(135deg,#06b6d4,#0284c7)',
      glow: 'rgba(6,182,212,0.5)',
    },
    {
      value: analytics.incidentsResolved,
      label: 'Incidents Resolved',
      icon: '✅',
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      glow: 'rgba(16,185,129,0.5)',
    },
    {
      value: `${analytics.satisfactionScore}/5`,
      label: 'Satisfaction',
      icon: '⭐',
      gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
      glow: 'rgba(245,158,11,0.5)',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Primary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {primaryStats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        {secondaryStats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Heatmap */}
      <SectionHeatmap sections={venue.sections} />

      {/* Hourly chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>📈</span>
            Hourly Attendance
          </h3>
          <span className="text-xs text-white/30 font-medium">Today</span>
        </div>
        <MiniBarChart data={analytics.hourlyOccupancy} />
      </div>

      {/* Queue management */}
      <div className="card">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>🚦</span>
          Queue Status
        </h3>
        <div className="space-y-3">
          {queues.map(q => {
            const pct = Math.round((q.length / q.maxLength) * 100);
            const colors = queueColor(pct);
            const badgeCls = pct > 80
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : pct > 50
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            return (
              <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-lg flex-shrink-0">{q.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-white truncate">{q.name}</span>
                    <span className="text-white/40 ml-2 flex-shrink-0">{q.waitTime}m</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill"
                      style={{ width: `${pct}%`, background: colors.bar, boxShadow: `0 0 6px ${colors.glow}` }} />
                  </div>
                </div>
                <span className={`badge ${badgeCls} flex-shrink-0`}>{q.length}/{q.maxLength}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottlenecks */}
      {analytics.bottlenecks?.length > 0 && (
        <div className="card border-red-500/30"
          style={{ background: 'rgba(239,68,68,0.08)' }}>
          <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2">
            <span>⚠️</span> Bottlenecks Detected
          </h3>
          <div className="flex gap-2 flex-wrap mb-2">
            {analytics.bottlenecks.map(b => (
              <span key={b} className="badge bg-red-500/20 text-red-400 border border-red-500/30">{b}</span>
            ))}
          </div>
          <p className="text-xs text-red-400/70">
            Consider redirecting attendees to less crowded sections.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Info View ───────────────────────────────────────────────────────────────────
function InfoView({ venue }) {
  const features = [
    { icon: '📡', title: 'Real-Time Crowd Tracking', desc: 'IoT sensors monitor occupancy across all sections live.', gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadowColor: 'rgba(59,130,246,0.3)' },
    { icon: '🕐', title: 'Virtual Queue System', desc: 'Skip physical lines — join queues directly from your phone.', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', shadowColor: 'rgba(168,85,247,0.3)' },
    { icon: '🗺️', title: 'Live Venue Heatmap', desc: 'Color-coded density maps guide you to quieter areas.', gradient: 'linear-gradient(135deg,#06b6d4,#0284c7)', shadowColor: 'rgba(6,182,212,0.3)' },
    { icon: '🛡️', title: 'Staff Dashboard', desc: 'Full situational awareness for the operations team.', gradient: 'linear-gradient(135deg,#10b981,#059669)', shadowColor: 'rgba(16,185,129,0.3)' },
    { icon: '⚡', title: 'Real-Time Updates', desc: 'WebSocket-powered instant notifications and live data.', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', shadowColor: 'rgba(245,158,11,0.3)' },
    { icon: '🤖', title: 'AI Predictions', desc: 'Machine learning predicts bottlenecks before they happen.', gradient: 'linear-gradient(135deg,#ec4899,#db2777)', shadowColor: 'rgba(236,72,153,0.3)' },
  ];

  const techStack = [
    ['Frontend', 'React + Tailwind CSS', '⚛️'],
    ['Backend', 'Node.js + Express', '🟢'],
    ['Real-time', 'WebSocket (ws)', '⚡'],
    ['Deployment', 'Vercel + Render', '🚀'],
    ['Mobile', 'React Native / Expo', '📱'],
    ['Containerized', 'Docker Compose', '🐳'],
  ];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg,#4c1d95,#7c3aed,#9333ea)',
          boxShadow: '0 20px 60px rgba(124,58,237,0.4)',
        }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#c4b5fd,transparent)' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            🏟️
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{venue.name}</h2>
            <p className="text-purple-200 text-sm font-medium">Smart Venue Experience System</p>
          </div>
        </div>
        <p className="relative mt-4 text-purple-100 text-sm leading-relaxed">
          Powered by real-time IoT sensors, AI-driven crowd analytics, and seamless digital experiences — making every visit smarter and safer.
        </p>
      </div>

      {/* Facilities */}
      <div className="card">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>🏢</span>
          Facilities
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {venue.facilities.map(f => (
            <div key={f.id}
              className="rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02] cursor-default"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm text-white">{f.name}</div>
              <div className="text-xs text-white/40 mt-0.5 mb-2">{f.location}</div>
              <span className={`badge text-xs border ${f.statusColor}`}>{f.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Smart features */}
      <div className="card">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>✨</span>
          Smart Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map(f => (
            <div key={f.title}
              className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: f.gradient, boxShadow: `0 4px 12px ${f.shadowColor}` }}>
                {f.icon}
              </div>
              <div>
                <div className="font-semibold text-sm text-white">{f.title}</div>
                <div className="text-xs text-white/40 mt-0.5 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="card">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>🛠️</span>
          Tech Stack
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {techStack.map(([label, value, icon]) => (
            <div key={label}
              className="rounded-xl p-3 border border-white/10 hover:border-white/20 transition-colors flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-lg">{icon}</span>
              <div>
                <div className="text-xs text-white/40 font-medium">{label}</div>
                <div className="text-xs font-semibold text-white">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="card">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>🔗</span>
          Links
        </h3>
        <div className="space-y-2">
          {[
            { icon: '⭐', label: 'GitHub Repository', url: 'https://github.com/LuckyCodeMaster/smart--venue--experience-system', gradient: 'linear-gradient(135deg,#1f2937,#374151)' },
            { icon: '🚀', label: 'Live Demo', url: 'https://sves-demo.vercel.app', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
          ].map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 hover:translate-x-1 group"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-xl">{l.icon}</span>
              <span className="font-semibold text-sm text-white flex-1">{l.label}</span>
              <span className="text-white/20 group-hover:text-white/50 transition-colors">→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('attendee');
  const [venue, setVenue] = useState(DEMO_VENUE);
  const [queues, setQueues] = useState(DEMO_QUEUES);
  const [analytics, setAnalytics] = useState(DEMO_ANALYTICS);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();
        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.venue) setVenue(data.venue);
            if (data.queues) setQueues(data.queues);
            if (data.analytics) setAnalytics(data.analytics);
          } catch { /* ignore parse errors */ }
        };
      } catch { /* ignore connection errors */ }
    };

    connect();
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-venue relative">
      <BackgroundOrbs />
      <div className="relative z-10">
        <NavBar view={view} setView={setView} connected={connected} />
        <main className="max-w-5xl mx-auto px-4 py-5 pb-12">
          {view === 'attendee' && <AttendeeView venue={venue} queues={queues} connected={connected} />}
          {view === 'staff' && <StaffView venue={venue} queues={queues} analytics={analytics} />}
          {view === 'info' && <InfoView venue={venue} />}
        </main>
      </div>
    </div>
  );
}

