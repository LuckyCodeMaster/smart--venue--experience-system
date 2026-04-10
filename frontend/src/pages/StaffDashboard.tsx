import { SocketState, Alert } from '../hooks/useSocket';
import Heatmap from '../components/Heatmap';
import QueueStatus from '../components/QueueStatus';

interface StaffDashboardProps {
  socketState: SocketState;
}

function AlertItem({ alert }: { alert: Alert }) {
  const { type, message, section, timestamp } = alert;
  const timeAgo = formatTimeAgo(new Date(timestamp));

  const styles = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700', icon: '🚨', text: 'text-red-700 dark:text-red-300' },
    warning:  { bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700', icon: '⚠️', text: 'text-yellow-700 dark:text-yellow-300' },
    info:     { bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700', icon: 'ℹ️', text: 'text-blue-700 dark:text-blue-300' },
  };

  const s = styles[type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${s.bg} animate-slide-up`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${s.text}`}>{message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">📍 {section}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">• {timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const secs = Math.round((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export default function StaffDashboard({ socketState }: StaffDashboardProps) {
  const { queues, heatmap, alerts, connected } = socketState;

  const totalPeople = 58420;
  const capacityPct = Math.round((totalPeople / 65000) * 100);
  const avgWait = queues.length > 0
    ? Math.round(queues.reduce((s, q) => s + q.waitMinutes, 0) / queues.length)
    : 0;
  const highDensityCount = heatmap.filter((z) => z.level === 'high').length;
  const criticalAlerts = alerts.filter((a) => a.type === 'critical' || a.type === 'warning');

  return (
    <div className="pb-4 animate-fade-in">
      {/* Header */}
      <div className="mx-4 mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Operations Center</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Staff Dashboard · Real-time</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          connected
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {connected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Attendance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {totalPeople.toLocaleString()}
          </p>
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{capacityPct}% capacity</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Avg Wait Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{avgWait} min</p>
          <p className={`text-xs mt-2 font-medium ${
            avgWait > 10 ? 'text-red-500' : avgWait > 5 ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {avgWait > 10 ? '🔴 High' : avgWait > 5 ? '🟡 Moderate' : '🟢 Low'}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">High Density Zones</p>
          <p className={`text-2xl font-bold mt-1 ${
            highDensityCount > 2 ? 'text-red-600' : highDensityCount > 0 ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {highDensityCount}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">of {heatmap.filter(z => z.sectionId !== 's5').length} sections</p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Alerts</p>
          <p className={`text-2xl font-bold mt-1 ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-green-500'}`}>
            {criticalAlerts.length}
          </p>
          <p className={`text-xs mt-2 font-medium ${
            criticalAlerts.length > 0 ? 'text-red-500' : 'text-green-500'
          }`}>
            {criticalAlerts.length > 0 ? '⚠️ Needs attention' : '✅ All clear'}
          </p>
        </div>
      </div>

      {/* Crowd Heatmap */}
      <div className="mx-4 mt-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Crowd Density Heatmap</h2>
        <Heatmap zones={heatmap} />
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="mx-4 mt-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
            Active Alerts
            {criticalAlerts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-semibold">
                {criticalAlerts.length}
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Queue Overview */}
      <div className="mx-4 mt-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Queue Overview</h2>
        <QueueStatus queues={queues} />
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mt-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Staff Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📢', label: 'Send Alert', color: 'bg-red-500 hover:bg-red-600' },
            { icon: '🔀', label: 'Redirect Flow', color: 'bg-yellow-500 hover:bg-yellow-600' },
            { icon: '🔓', label: 'Open Gate', color: 'bg-green-500 hover:bg-green-600' },
            { icon: '📋', label: 'View Reports', color: 'bg-blue-500 hover:bg-blue-600' },
          ].map((action) => (
            <button
              key={action.label}
              className={`${action.color} text-white rounded-xl p-4 flex items-center gap-3
                min-h-[56px] font-semibold text-sm transition-all duration-150
                active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <span className="text-xl">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
