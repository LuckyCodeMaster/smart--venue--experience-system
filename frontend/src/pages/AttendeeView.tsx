import { useState, useCallback } from 'react';
import { SocketState } from '../hooks/useSocket';
import VenueMap from '../components/VenueMap';
import QueueStatus from '../components/QueueStatus';

interface AttendeeViewProps {
  socketState: SocketState;
}

const MOCK_FACILITIES = [
  { id: 'f1', type: 'restroom' as const, name: 'Restroom - North A', level: 1, x: 25, y: 10, available: true },
  { id: 'f2', type: 'restroom' as const, name: 'Restroom - South A', level: 1, x: 55, y: 82, available: true },
  { id: 'f3', type: 'food' as const, name: 'Food Court - East', level: 1, x: 83, y: 35, available: true },
  { id: 'f4', type: 'food' as const, name: 'Food Court - West', level: 1, x: 5, y: 60, available: true },
  { id: 'f5', type: 'merch' as const, name: 'Merchandise Store', level: 1, x: 45, y: 8, available: true },
  { id: 'f6', type: 'firstaid' as const, name: 'First Aid Station', level: 1, x: 83, y: 60, available: true },
  { id: 'f7', type: 'exit' as const, name: 'Main Exit', level: 0, x: 45, y: 96, available: true },
  { id: 'f8', type: 'exit' as const, name: 'North Exit', level: 0, x: 45, y: 2, available: true },
];

export default function AttendeeView({ socketState }: AttendeeViewProps) {
  const [joinedQueueId, setJoinedQueueId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [userId] = useState(() =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `user-${Date.now().toString(36)}`
  );

  const handleJoinQueue = useCallback(
    async (queueId: string) => {
      try {
        const res = await fetch('/api/queue/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queueId, userId }),
        });
        const data = await res.json();
        if (data.success) {
          setJoinedQueueId(queueId);
          setNotification(data.data.message);
          setTimeout(() => setNotification(null), 4000);
        }
      } catch {
        // Optimistic update if API unavailable
        setJoinedQueueId(queueId);
        const queue = socketState.queues.find((q) => q.id === queueId);
        if (queue) {
          setNotification(`Joined ${queue.facilityName} queue!`);
          setTimeout(() => setNotification(null), 4000);
        }
      }
    },
    [userId, socketState.queues]
  );

  return (
    <div className="pb-4 animate-fade-in">
      {/* Success Notification */}
      {notification && (
        <div className="mx-4 mt-4 p-4 bg-green-500 text-white rounded-xl shadow-lg animate-slide-up flex items-center gap-3">
          <span className="text-xl">✅</span>
          <p className="font-medium text-sm">{notification}</p>
        </div>
      )}

      {/* Venue Status Banner */}
      <div className="mx-4 mt-4 card p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Championship Finals 2026</p>
            <p className="text-xl font-bold mt-0.5">Grand Arena Stadium</p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Kickoff</p>
            <p className="text-lg font-bold">7:30 PM</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-500 flex gap-4">
          <div>
            <p className="text-blue-200 text-xs">Attendance</p>
            <p className="font-semibold text-sm">58,420 / 65,000</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Section</p>
            <p className="font-semibold text-sm">West Wing, Row G</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Seat</p>
            <p className="font-semibold text-sm">G-14</p>
          </div>
        </div>
      </div>

      {/* Venue Map */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Venue Map</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            You are here
          </span>
        </div>
        <VenueMap facilities={MOCK_FACILITIES} userLocation={{ x: 11, y: 51 }} />
      </div>

      {/* Queue Status */}
      <div className="mx-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Queue Status</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {socketState.connected ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                Live
              </span>
            ) : (
              'Offline'
            )}
          </span>
        </div>

        {joinedQueueId && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl flex items-center gap-2">
            <span className="text-lg">🎟️</span>
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">You're in queue!</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                We'll notify you when it's your turn.
              </p>
            </div>
            <button
              className="ml-auto text-xs text-blue-500 hover:text-blue-700 underline"
              onClick={() => setJoinedQueueId(null)}
            >
              Leave
            </button>
          </div>
        )}

        <QueueStatus
          queues={socketState.queues}
          onJoin={handleJoinQueue}
          joinedQueueId={joinedQueueId}
        />
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mt-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🚻', label: 'Find Restroom', action: () => {} },
            { icon: '🍕', label: 'Order Food', action: () => {} },
            { icon: '🆘', label: 'Get Help', action: () => {} },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="card flex flex-col items-center justify-center gap-2 p-4 min-h-[72px]
                hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95
                transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
