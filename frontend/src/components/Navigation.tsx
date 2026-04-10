type Page = 'attendee' | 'staff' | 'info';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'attendee', label: 'My View', icon: '📍' },
  { id: 'staff', label: 'Operations', icon: '📊' },
  { id: 'info', label: 'Info', icon: 'ℹ️' },
];

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
      <div className="max-w-4xl mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px]
                transition-colors duration-150 ease-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-12 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
