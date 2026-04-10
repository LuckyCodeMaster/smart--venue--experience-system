import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import Navigation from './components/Navigation';
import AttendeeView from './pages/AttendeeView';
import StaffDashboard from './pages/StaffDashboard';
import InfoScreen from './pages/InfoScreen';

type Page = 'attendee' | 'staff' | 'info';

function App() {
  const [page, setPage] = useState<Page>('attendee');
  const [darkMode, setDarkMode] = useState(false);
  const socketState = useSocket();

  const toggleDark = () => {
    setDarkMode((d) => !d);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Top Header */}
      <header className="bg-blue-700 dark:bg-blue-900 text-white shadow-lg z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏟️</span>
            <div>
              <h1 className="font-bold text-base leading-tight">Grand Arena</h1>
              <p className="text-blue-200 text-xs">Championship Finals 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  socketState.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              <span className="text-xs text-blue-200 hidden sm:inline">
                {socketState.connected ? 'Live' : 'Offline'}
              </span>
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-lg hover:bg-blue-600 active:bg-blue-500 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {page === 'attendee' && <AttendeeView socketState={socketState} />}
          {page === 'staff' && <StaffDashboard socketState={socketState} />}
          {page === 'info' && <InfoScreen />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <Navigation currentPage={page} onNavigate={setPage} />
    </div>
  );
}

export default App;
