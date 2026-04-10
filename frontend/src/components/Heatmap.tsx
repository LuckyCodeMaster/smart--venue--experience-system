import { HeatmapZone } from '../hooks/useSocket';

interface HeatmapProps {
  zones: HeatmapZone[];
}

function densityToColor(density: number): string {
  if (density >= 80) return '#ef4444cc'; // red
  if (density >= 50) return '#f59e0bcc'; // amber
  return '#22c55ecc';                    // green
}

function densityToStroke(density: number): string {
  if (density >= 80) return '#dc2626';
  if (density >= 50) return '#d97706';
  return '#16a34a';
}

export default function Heatmap({ zones }: HeatmapProps) {
  if (zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 dark:bg-gray-700 rounded-xl">
        <p className="text-gray-400 text-sm">Loading heatmap...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SVG Heatmap */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-900">
        <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: '1 / 1' }}>
          {/* Dark background */}
          <rect width="100" height="100" fill="#111827" />

          {/* Heatmap zones */}
          {zones.map((zone) => (
            <g key={zone.id}>
              <rect
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                rx="3"
                fill={densityToColor(zone.density)}
                stroke={densityToStroke(zone.density)}
                strokeWidth="0.8"
                className="transition-all duration-700"
              />
              {/* Density label */}
              {zone.sectionId !== 's5' && (
                <>
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 - 2}
                    textAnchor="middle"
                    fontSize="4"
                    fill="white"
                    fontWeight="700"
                  >
                    {zone.density}%
                  </text>
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 + 4}
                    textAnchor="middle"
                    fontSize="3"
                    fill="rgba(255,255,255,0.8)"
                  >
                    {zone.name}
                  </text>
                </>
              )}
            </g>
          ))}

          {/* Field (center) */}
          <ellipse cx="50" cy="50" rx="26" ry="23" fill="#1a2e1a" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="2,1" />
          <text x="50" y="52" textAnchor="middle" fontSize="4" fill="#4ade80">⚽ Field</text>
        </svg>

        {/* Legend overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-3 justify-center">
          <span className="flex items-center gap-1 text-xs text-white bg-black/40 rounded px-2 py-1">
            <span className="w-3 h-3 rounded bg-green-500 inline-block" /> Low (&lt;50%)
          </span>
          <span className="flex items-center gap-1 text-xs text-white bg-black/40 rounded px-2 py-1">
            <span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Med (50-80%)
          </span>
          <span className="flex items-center gap-1 text-xs text-white bg-black/40 rounded px-2 py-1">
            <span className="w-3 h-3 rounded bg-red-500 inline-block" /> High (&gt;80%)
          </span>
        </div>
      </div>

      {/* Zone Cards */}
      <div className="grid grid-cols-2 gap-2">
        {zones.filter((z) => z.sectionId !== 's5').map((zone) => (
          <div
            key={zone.id}
            className="card p-3 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: densityToColor(zone.density) }}
            >
              {zone.density}%
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{zone.name}</p>
              <p className={`text-xs capitalize font-medium mt-0.5 ${
                zone.level === 'high' ? 'text-red-500' :
                zone.level === 'medium' ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {zone.level === 'high' ? '🔴' : zone.level === 'medium' ? '🟡' : '🟢'} {zone.level}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
