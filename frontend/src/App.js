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
    { id: 'A', name: 'Main Stage', capacity: 1500, occupancy: 892, color: '#ef4444' },
    { id: 'B', name: 'Food Court', capacity: 800,  occupancy: 634, color: '#f97316' },
    { id: 'C', name: 'Exhibition Hall', capacity: 1200, occupancy: 421, color: '#22c55e' },
    { id: 'D', name: 'VIP Lounge', capacity: 300, occupancy: 187, color: '#3b82f6' },
    { id: 'E', name: 'East Wing', capacity: 700, occupancy: 156, color: '#22c55e' },
    { id: 'F', name: 'West Wing', capacity: 500, occupancy: 57, color: '#22c55e' },
  ],
  facilities: [
    { id: 1, name: 'Restrooms', icon: '🚻', location: 'Multiple locations', status: 'Available' },
    { id: 2, name: 'First Aid', icon: '🏥', location: 'Main entrance, Section C', status: 'Staffed' },
    { id: 3, name: 'Information Desk', icon: 'ℹ️', location: 'Main lobby', status: 'Open' },
    { id: 4, name: 'Parking', icon: '🅿️', location: 'North & South lots', status: '60% Full' },
    { id: 5, name: 'ATM', icon: '💳', location: 'Food court entrance', status: 'Available' },
    { id: 6, name: 'WiFi', icon: '📶', location: 'Venue-wide', status: 'Active' },
  ],
};

const DEMO_QUEUES = [
  { id: 1, name: 'Main Stage Entry', location: 'Gate A', waitTime: 8, length: 34, maxLength: 100, status: 'open' },
  { id: 2, name: 'Food Court', location: 'Section B', waitTime: 12, length: 56, maxLength: 80, status: 'open' },
  { id: 3, name: 'VIP Check-in', location: 'Gate D', waitTime: 3, length: 8, maxLength: 30, status: 'open' },
  { id: 4, name: 'Merchandise', location: 'Main lobby', waitTime: 15, length: 72, maxLength: 100, status: 'open' },
  { id: 5, name: 'Exhibition Entry', location: 'Gate C', waitTime: 5, length: 21, maxLength: 60, status: 'open' },
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
    { hour: '10:00', count: 320 },
    { hour: '11:00', count: 780 },
    { hour: '12:00', count: 1250 },
    { hour: '13:00', count: 1890 },
    { hour: '14:00', count: 2540 },
    { hour: '15:00', count: 2890 },
    { hour: '16:00', count: 2347 },
    { hour: '17:00', count: 2100 },
    { hour: '18:00', count: 1870 },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────────
function occupancyPercent(section) {
  return Math.round((section.occupancy / section.capacity) * 100);
}

function crowdLabel(pct) {
  if (pct >= 80) return { label: 'Crowded', cls: 'bg-red-100 text-red-700' };
  if (pct >= 50) return { label: 'Busy', cls: 'bg-orange-100 text-orange-700' };
  return { label: 'Clear', cls: 'bg-green-100 text-green-700' };
}

// ── NavBar ───────────────────────────────────────────────────────────────────────
function NavBar({ view, setView, connected }) {
  const tabs = [
    { id: 'attendee', label: '🎟️ Attendee', icon: '🎟️' },
    { id: 'staff', label: '🛡️ Staff', icon: '🛡️' },
    { id: 'info', label: 'ℹ️ Info', icon: 'ℹ️' },
  ];
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏟️</span>
          <div>
            <h1 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">Smart Venue</h1>
            <p className="text-xs text-gray-400 hidden sm:block">Experience System</p>
          </div>
        </div>
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                view === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="sm:hidden">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'} animate-pulse`} />
          <span className="text-xs text-gray-400 hidden sm:block">{connected ? 'Live' : 'Demo'}</span>
        </div>
      </div>
    </header>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────────
function StatCard({ value, label, color = 'blue', icon }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="card flex flex-col items-center justify-center text-center py-5">
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className={`text-2xl font-bold ${colors[color].split(' ')[1]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ── Section heatmap ───────────────────────────────────────────────────────────────
function SectionHeatmap({ sections }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        🗺️ Venue Heatmap <span className="text-xs text-gray-400 font-normal">Live crowd density</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sections.map(sec => {
          const pct = occupancyPercent(sec);
          const crowd = crowdLabel(pct);
          return (
            <div
              key={sec.id}
              className="rounded-xl p-3 transition-all duration-700"
              style={{ backgroundColor: sec.color + '22', borderLeft: `4px solid ${sec.color}` }}
            >
              <div className="font-semibold text-sm text-gray-800">{sec.name}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">{sec.occupancy}/{sec.capacity}</span>
                <span className={`badge ${crowd.cls}`}>{crowd.label}</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: sec.color }}
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-0.5">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Queue card ─────────────────────────────────────────────────────────────────────
function QueueCard({ queue, joinedId, onJoin, onLeave, visitorId }) {
  const isJoined = joinedId === queue.id;
  const pct = Math.round((queue.length / queue.maxLength) * 100);

  return (
    <div className={`card transition-all duration-300 ${isJoined ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{queue.name}</h3>
          <p className="text-xs text-gray-500">{queue.location}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-blue-600">{queue.waitTime}m</div>
          <div className="text-xs text-gray-400">wait time</div>
        </div>
      </div>
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: pct > 80 ? '#ef4444' : pct > 50 ? '#f97316' : '#22c55e',
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{queue.length} in queue</span>
        <span>{queue.maxLength} max</span>
      </div>
      <div className="mt-3 flex gap-2">
        {isJoined ? (
          <>
            <div className="flex-1 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-xl py-2">
              ✅ You're in queue • Position #{queue.length}
            </div>
            <button
              onClick={() => onLeave(queue.id)}
              className="btn-secondary text-sm py-2"
            >
              Leave
            </button>
          </>
        ) : (
          <button
            onClick={() => onJoin(queue.id)}
            disabled={!!joinedId}
            className={`flex-1 ${joinedId ? 'opacity-40 cursor-not-allowed' : ''} btn-primary text-sm`}
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
    setTimeout(() => setNotification(null), 3000);
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
        showNotif(`Joined queue! Estimated wait: ${data.queue.waitTime} min`);
      } else {
        // Offline demo mode
        setJoinedQueueId(queueId);
        showNotif('Joined queue! (demo mode)');
      }
    } catch {
      setJoinedQueueId(queueId);
      showNotif('Joined queue! (demo mode)');
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
    showNotif('Left the queue', 'info');
  }, [visitorId]);

  const totalPct = Math.round((venue.currentOccupancy / venue.capacity) * 100);

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* Venue summary */}
      <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{venue.name}</h2>
            <p className="text-blue-100 text-sm">Live venue status</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{venue.currentOccupancy.toLocaleString()}</div>
            <div className="text-blue-200 text-sm">of {venue.capacity.toLocaleString()} capacity</div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-blue-500 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${totalPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-blue-200 mt-1">
          <span>Occupancy</span>
          <span>{totalPct}% full</span>
        </div>
      </div>

      {/* Heatmap */}
      <SectionHeatmap sections={venue.sections} />

      {/* Queues */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">🕐 Virtual Queues</h3>
        <p className="text-xs text-gray-500 mb-3">
          {joinedQueueId
            ? '✅ You\'re in a queue — leave to join another'
            : 'Join a queue to skip the physical line'}
        </p>
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

// ── Bar chart ───────────────────────────────────────────────────────────────────
function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const h = Math.round((d.count / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-blue-500 rounded-t transition-all duration-500" style={{ height: `${h}%` }} />
            <span className="text-xs text-gray-400 whitespace-nowrap" style={{ fontSize: '9px' }}>{d.hour}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Staff View ──────────────────────────────────────────────────────────────────
function StaffView({ venue, queues, analytics }) {
  const totalPct = Math.round((venue.currentOccupancy / venue.capacity) * 100);

  return (
    <div className="space-y-4">
      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={venue.currentOccupancy.toLocaleString()} label="Current Visitors" icon="👥" color="blue" />
        <StatCard value={`${totalPct}%`} label="Capacity Used" icon="📊" color={totalPct > 80 ? 'red' : totalPct > 60 ? 'orange' : 'green'} />
        <StatCard value={`${analytics.avgWaitTime}m`} label="Avg Wait Time" icon="⏱️" color="purple" />
        <StatCard value={analytics.staffOnDuty} label="Staff On Duty" icon="👮" color="green" />
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={analytics.eventsToday} label="Events Today" icon="🎪" color="blue" />
        <StatCard value={analytics.incidentsResolved} label="Incidents Resolved" icon="✅" color="green" />
        <StatCard value={`${analytics.satisfactionScore}/5`} label="Satisfaction" icon="⭐" color="orange" />
      </div>

      {/* Heatmap */}
      <SectionHeatmap sections={venue.sections} />

      {/* Hourly chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">📈 Hourly Attendance</h3>
        <MiniBarChart data={analytics.hourlyOccupancy} />
      </div>

      {/* Queue management */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">🚦 Queue Status</h3>
        <div className="space-y-2">
          {queues.map(q => {
            const pct = Math.round((q.length / q.maxLength) * 100);
            return (
              <div key={q.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{q.name}</span>
                    <span className="text-gray-500">{q.waitTime}m wait</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct > 80 ? '#ef4444' : pct > 50 ? '#f97316' : '#22c55e',
                      }}
                    />
                  </div>
                </div>
                <span className={`badge ${pct > 80 ? 'bg-red-100 text-red-700' : pct > 50 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                  {q.length}/{q.maxLength}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottlenecks */}
      {analytics.bottlenecks?.length > 0 && (
        <div className="card bg-red-50 border-red-100">
          <h3 className="font-semibold text-red-700 mb-2">⚠️ Bottlenecks Detected</h3>
          <div className="flex gap-2 flex-wrap">
            {analytics.bottlenecks.map(b => (
              <span key={b} className="badge bg-red-100 text-red-700">{b}</span>
            ))}
          </div>
          <p className="text-xs text-red-500 mt-2">Consider redirecting attendees to less crowded sections.</p>
        </div>
      )}
    </div>
  );
}

// ── Info View ───────────────────────────────────────────────────────────────────
function InfoView({ venue }) {
  return (
    <div className="space-y-4">
      {/* About */}
      <div className="card bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">🏟️</span>
          <div>
            <h2 className="text-xl font-bold">{venue.name}</h2>
            <p className="text-purple-200 text-sm">Smart Venue Experience System</p>
          </div>
        </div>
        <p className="text-purple-100 text-sm">
          Powered by real-time IoT sensors, AI-driven crowd analytics, and seamless digital experiences.
        </p>
      </div>

      {/* Facilities */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">🏢 Facilities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {venue.facilities.map(f => (
            <div key={f.id} className="bg-gray-50 rounded-xl p-3">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="font-medium text-sm text-gray-800">{f.name}</div>
              <div className="text-xs text-gray-500">{f.location}</div>
              <div className="mt-2">
                <span className="badge bg-green-100 text-green-700 text-xs">{f.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">✨ Smart Features</h3>
        <div className="space-y-3">
          {[
            { icon: '📡', title: 'Real-Time Crowd Tracking', desc: 'IoT sensors monitor occupancy across all sections live.' },
            { icon: '🕐', title: 'Virtual Queue System', desc: 'Skip physical lines — join queues from your phone.' },
            { icon: '🗺️', title: 'Live Venue Heatmap', desc: 'Color-coded density maps guide you to quieter areas.' },
            { icon: '🛡️', title: 'Staff Dashboard', desc: 'Operations team has full situational awareness.' },
            { icon: '⚡', title: 'Real-Time Updates', desc: 'WebSocket-powered instant notifications and updates.' },
            { icon: '🤖', title: 'AI Predictions', desc: 'Machine learning predicts bottlenecks before they happen.' },
          ].map(f => (
            <div key={f.title} className="flex gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <div className="font-medium text-sm text-gray-800">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">🛠️ Tech Stack</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['Frontend', 'React + Tailwind CSS'],
            ['Backend', 'Node.js + Express'],
            ['Real-time', 'WebSocket (ws)'],
            ['Deployment', 'Vercel + Render'],
            ['Mobile', 'React Native / Expo'],
            ['Containerized', 'Docker Compose'],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-2">
              <div className="text-xs text-gray-400">{label}</div>
              <div className="font-medium text-gray-700">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">🔗 Links</h3>
        <div className="space-y-2">
          {[
            { icon: '⭐', label: 'GitHub Repository', url: 'https://github.com/LuckyCodeMaster/smart--venue--experience-system', color: 'text-gray-700' },
            { icon: '🚀', label: 'Live Demo', url: 'https://sves-demo.vercel.app', color: 'text-blue-600' },
          ].map(l => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors ${l.color}`}
            >
              <span>{l.icon}</span>
              <span className="font-medium text-sm">{l.label}</span>
              <span className="ml-auto text-gray-300">→</span>
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
    <div className="min-h-screen bg-gray-50">
      <NavBar view={view} setView={setView} connected={connected} />
      <main className="max-w-5xl mx-auto px-4 py-4 pb-8">
        {view === 'attendee' && <AttendeeView venue={venue} queues={queues} connected={connected} />}
        {view === 'staff' && <StaffView venue={venue} queues={queues} analytics={analytics} />}
        {view === 'info' && <InfoView venue={venue} />}
      </main>
    </div>
  );
}
