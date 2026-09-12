import React from 'react';
import { useApp, TabType } from '../context/AppContext';

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, allowedTabs, t } = useApp();

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: t.navDashboard, icon: 'dashboard' },
    { id: 'meals', label: t.navMeals, icon: 'restaurant' },
    { id: 'deposits', label: t.navDeposits, icon: 'account_balance_wallet' },
    { id: 'bills', label: t.navBills, icon: 'receipt_long' },
    { id: 'profile', label: t.navProfile, icon: 'person' },
  ];

  // Role-gated: strictly filtered by allowedTabs
  const navItems = allNavItems.filter((item) => allowedTabs.includes(item.id));

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="min-[600px]:hidden fixed bottom-0 inset-x-0 z-40 pb-3 px-3 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="h-16 px-1.5 bg-[var(--surface-container)]/95 backdrop-blur-xl rounded-full shadow-[0_8px_28px_rgba(17,28,45,0.18)] border border-white/20 dark:border-white/5 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-all select-none ${
                  isActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                }`}
              >
                <div
                  className={`flex items-center justify-center h-8 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'w-12 bg-[var(--primary-container)]/20 text-[var(--primary)]'
                      : 'w-10 text-[var(--on-surface-variant)]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] transition-transform ${
                      isActive ? 'scale-110 font-bold' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold mt-0.5 tracking-tight ${
                    isActive ? 'text-[var(--primary)] font-extrabold' : 'opacity-85'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
