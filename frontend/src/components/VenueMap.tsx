interface Facility {
  id: string;
  type: 'restroom' | 'food' | 'merch' | 'firstaid' | 'exit';
  name: string;
  level: number;
  x: number;
  y: number;
  available: boolean;
}

const FACILITY_ICONS: Record<Facility['type'], string> = {
  restroom: '🚻',
  food: '🍕',
  merch: '🎽',
  firstaid: '🏥',
  exit: '🚪',
};



interface VenueMapProps {
  facilities: Facility[];
  userLocation?: { x: number; y: number };
}

export default function VenueMap({ facilities, userLocation = { x: 50, y: 50 } }: VenueMapProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
      <svg
        viewBox="0 0 100 100"
        className="w-full"
        style={{ aspectRatio: '1 / 1' }}
        role="img"
        aria-label="Venue map"
      >
        {/* Background */}
        <rect width="100" height="100" fill="#f1f5f9" />

        {/* ── Sections ─────────────────────────────────────────── */}
        {/* North Stand */}
        <rect x="20" y="5" width="60" height="18" rx="3" fill="#3b82f630" stroke="#3b82f6" strokeWidth="0.8" />
        <text x="50" y="15.5" textAnchor="middle" fontSize="4.5" fill="#1d4ed8" fontWeight="600">North Stand</text>

        {/* South Stand */}
        <rect x="20" y="77" width="60" height="18" rx="3" fill="#ef444430" stroke="#ef4444" strokeWidth="0.8" />
        <text x="50" y="87.5" textAnchor="middle" fontSize="4.5" fill="#b91c1c" fontWeight="600">South Stand</text>

        {/* East Wing */}
        <rect x="80" y="23" width="18" height="54" rx="3" fill="#8b5cf630" stroke="#8b5cf6" strokeWidth="0.8" />
        <text x="89" y="51" textAnchor="middle" fontSize="4" fill="#6d28d9" fontWeight="600" transform="rotate(90,89,51)">East Wing</text>

        {/* West Wing */}
        <rect x="2" y="23" width="18" height="54" rx="3" fill="#f59e0b30" stroke="#f59e0b" strokeWidth="0.8" />
        <text x="11" y="51" textAnchor="middle" fontSize="4" fill="#b45309" fontWeight="600" transform="rotate(-90,11,51)">West Wing</text>

        {/* Field */}
        <ellipse cx="50" cy="50" rx="26" ry="23" fill="#22c55e20" stroke="#16a34a" strokeWidth="0.8" strokeDasharray="2,1" />
        <text x="50" y="52" textAnchor="middle" fontSize="4" fill="#15803d" fontWeight="500">⚽ Field</text>

        {/* ── Facilities ───────────────────────────────────────── */}
        {facilities.map((f) => (
          <g key={f.id}>
            <circle
              cx={f.x}
              cy={f.y}
              r="4.5"
              fill={f.available ? 'white' : '#fca5a5'}
              stroke={f.type === 'firstaid' ? '#ef4444' : f.type === 'exit' ? '#6b7280' : '#2563eb'}
              strokeWidth="1.2"
            />
            <text x={f.x} y={f.y + 1.8} textAnchor="middle" fontSize="5" role="img" aria-label={f.name}>
              {FACILITY_ICONS[f.type]}
            </text>
          </g>
        ))}

        {/* ── User Location ────────────────────────────────────── */}
        <circle cx={userLocation.x} cy={userLocation.y} r="6" fill="#2563eb15" />
        <circle cx={userLocation.x} cy={userLocation.y} r="3.5" fill="#2563eb" />
        <circle cx={userLocation.x} cy={userLocation.y} r="2" fill="white" />
        <text
          x={userLocation.x}
          y={userLocation.y - 8}
          textAnchor="middle"
          fontSize="3.5"
          fill="#1d4ed8"
          fontWeight="700"
        >
          You
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
        {Object.entries(FACILITY_ICONS).map(([type, icon]) => (
          type !== 'exit' && (
            <span key={type} className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <span>{icon}</span>
              <span className="capitalize">{type === 'firstaid' ? 'First Aid' : type}</span>
            </span>
          )
        ))}
        <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          <span>You</span>
        </span>
      </div>
    </div>
  );
}


