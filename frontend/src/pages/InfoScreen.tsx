const SECTIONS = [
  { id: 's1', name: 'North Stand', seats: '101–140', access: 'Gates A, B', level: 'Upper' },
  { id: 's2', name: 'South Stand', seats: '201–240', access: 'Gates C, D', level: 'Upper' },
  { id: 's3', name: 'East Wing', seats: '301–360', access: 'Gate E', level: 'Ground' },
  { id: 's4', name: 'West Wing', seats: '401–460', access: 'Gate F', level: 'Ground' },
];

const CONCESSIONS = [
  { id: 'c1', name: 'Stadium Grill', type: 'food', icon: '🍔', items: 'Burgers, Hot Dogs, Nachos', location: 'East Wing, Level 1', wait: '8 min' },
  { id: 'c2', name: 'Pizza Palace', type: 'food', icon: '🍕', items: 'Pizza slices, Garlic bread', location: 'North Stand, Level 1', wait: '5 min' },
  { id: 'c3', name: 'Drinks & Snacks', type: 'drinks', icon: '🥤', items: 'Beverages, Popcorn, Chips', location: 'All sections', wait: '3 min' },
  { id: 'c4', name: 'Taco Zone', type: 'food', icon: '🌮', items: 'Tacos, Burritos, Nachos', location: 'West Wing, Level 1', wait: '7 min' },
];

const FACILITIES = [
  { id: 'r1', name: 'Restroom — North A', icon: '🚻', location: 'North Stand, Gate A', available: true },
  { id: 'r2', name: 'Restroom — South A', icon: '🚻', location: 'South Stand, Gate C', available: true },
  { id: 'r3', name: 'Restroom — East', icon: '🚻', location: 'East Wing, Gate E', available: true },
  { id: 'r4', name: 'First Aid Station', icon: '🏥', location: 'East Wing, near Gate E', available: true },
  { id: 'r5', name: 'Lost & Found', icon: '🔍', location: 'Main Entrance, Gate 1', available: true },
  { id: 'r6', name: 'Information Desk', icon: '📌', location: 'Main Lobby', available: true },
  { id: 'r7', name: 'ATM / Cash Point', icon: '💳', location: 'Gates B & D', available: true },
  { id: 'r8', name: 'Family Room', icon: '👶', location: 'West Wing, Level 1', available: true },
];

const TRANSPORT = [
  { id: 't1', icon: '🚇', mode: 'Metro / Subway', details: 'Stadium Station — Line 3, exit 2', tip: 'Nearest & fastest option' },
  { id: 't2', icon: '🚌', mode: 'Bus', details: 'Routes 42, 67, 88 — stop at Main Gate', tip: 'Runs every 10 minutes' },
  { id: 't3', icon: '🚗', mode: 'Parking', details: 'Lots A (North), B (South), C (East)', tip: 'Book in advance via app' },
  { id: 't4', icon: '🚕', mode: 'Taxi / Rideshare', details: 'Drop-off zone at South Gate', tip: 'Uber & Lyft available' },
];

type Tab = 'sections' | 'food' | 'facilities' | 'transport';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sections', label: 'Sections', icon: '🗺️' },
  { id: 'food', label: 'Food', icon: '🍕' },
  { id: 'facilities', label: 'Facilities', icon: '🚻' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
];

import { useState } from 'react';

export default function InfoScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('sections');

  return (
    <div className="pb-4 animate-fade-in">
      {/* Banner */}
      <div className="mx-4 mt-4 card overflow-hidden">
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-5">
          <h1 className="text-xl font-bold">Grand Arena Stadium</h1>
          <p className="text-blue-200 text-sm mt-1">Championship Finals 2026 · Tonight 7:30 PM</p>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-blue-300 text-xs font-medium">Capacity</p>
              <p className="text-white font-bold">65,000</p>
            </div>
            <div>
              <p className="text-blue-300 text-xs font-medium">Opened</p>
              <p className="text-white font-bold">2019</p>
            </div>
            <div>
              <p className="text-blue-300 text-xs font-medium">WiFi</p>
              <p className="text-white font-bold">StadiumFree</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-4">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium
                transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-4 mt-4 space-y-3 animate-fade-in">
        {/* Sections */}
        {activeTab === 'sections' && SECTIONS.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{s.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Seats {s.seats}</p>
              </div>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                {s.level}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <span className="text-sm">🚪</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">Access via {s.access}</span>
            </div>
          </div>
        ))}

        {/* Food */}
        {activeTab === 'food' && CONCESSIONS.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{c.name}</p>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium flex-shrink-0">
                    ⏱ {c.wait}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.items}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                  <span>📍</span> {c.location}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Facilities */}
        {activeTab === 'facilities' && FACILITIES.map((f) => (
          <div key={f.id} className="card p-4 flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{f.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                <span>📍</span> {f.location}
              </p>
            </div>
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400" title="Available" />
          </div>
        ))}

        {/* Transport */}
        {activeTab === 'transport' && TRANSPORT.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{t.icon}</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">{t.mode}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t.details}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">💡 {t.tip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Info */}
      <div className="mx-4 mt-5 card p-4 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🆘</span>
          <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">Emergency Information</h3>
        </div>
        <div className="space-y-1.5 text-xs text-red-700 dark:text-red-400">
          <p>📞 Security: <strong>ext. 911</strong></p>
          <p>🏥 Medical: <strong>East Wing, Gate E</strong></p>
          <p>🚪 Nearest Exit: <strong>Follow green signs</strong></p>
          <p>🚒 Assembly Point: <strong>South Parking Lot</strong></p>
        </div>
      </div>
    </div>
  );
}
