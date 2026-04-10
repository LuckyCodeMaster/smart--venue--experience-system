import { useState } from 'react';
import { Queue } from '../hooks/useSocket';

interface QueueStatusProps {
  queues: Queue[];
  onJoin?: (queueId: string) => void;
  joinedQueueId?: string | null;
}

const STATUS_COLORS = {
  low: {
    bar: 'bg-green-500',
    badge: 'badge-low',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
  },
  medium: {
    bar: 'bg-yellow-400',
    badge: 'badge-medium',
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800',
  },
  high: {
    bar: 'bg-red-500',
    badge: 'badge-high',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
  },
};

export default function QueueStatus({ queues, onJoin, joinedQueueId }: QueueStatusProps) {
  const [joining, setJoining] = useState<string | null>(null);

  const handleJoin = async (queueId: string) => {
    if (!onJoin) return;
    setJoining(queueId);
    await new Promise((r) => setTimeout(r, 600)); // Simulate network
    onJoin(queueId);
    setJoining(null);
  };

  if (queues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
        <span className="text-4xl mb-2">⏳</span>
        <p className="text-sm">Loading queues...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queues.map((queue) => {
        const style = STATUS_COLORS[queue.status];
        const fillPct = Math.round((queue.currentSize / queue.maxSize) * 100);
        const isJoined = joinedQueueId === queue.id;
        const isJoining = joining === queue.id;

        return (
          <div
            key={queue.id}
            className={`card border p-4 animate-fade-in transition-all duration-300 ${
              isJoined ? 'ring-2 ring-blue-500' : ''
            } ${style.bg}`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: Icon + Name */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">{queue.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {queue.facilityName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${style.text}`}>
                      ⏱ {queue.waitMinutes} min wait
                    </span>
                    <span className={style.badge}>
                      {queue.status.charAt(0).toUpperCase() + queue.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Join Button */}
              {onJoin && (
                <button
                  onClick={() => handleJoin(queue.id)}
                  disabled={isJoined || isJoining}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold
                    min-h-[40px] transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${
                      isJoined
                        ? 'bg-green-500 text-white cursor-default focus:ring-green-400'
                        : isJoining
                        ? 'bg-blue-400 text-white cursor-wait focus:ring-blue-400'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500'
                    }`}
                >
                  {isJoined ? '✓ Joined' : isJoining ? '⏳ Joining...' : 'Join Queue'}
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{queue.currentSize} people</span>
                <span>Max {queue.maxSize}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full progress-bar transition-all duration-500 ${style.bar}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
