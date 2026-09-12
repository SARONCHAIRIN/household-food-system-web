import React from 'react';
import { useApp, TabType } from '../context/AppContext';

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
  khmerLabel: string;
}

export const AdaptiveNavigationRail: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    allowedTabs,
    userRole,
    currentUser,
    language,
    setLanguage,
    theme,
    toggleTheme,
    logout,
    t,
  } = useApp();

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: t.navDashboard, khmerLabel: 'ផ្ទាំងគ្រប់គ្រង', icon: 'dashboard' },
    { id: 'meals', label: t.navMeals, khmerLabel: 'វត្តមានអាហារ', icon: 'restaurant' },
    { id: 'deposits', label: t.navDeposits, khmerLabel: 'ប្រាក់តម្កល់', icon: 'account_balance_wallet' },
    { id: 'bills', label: t.navBills, khmerLabel: 'វិក្កយបត្រ', icon: 'receipt_long' },
    { id: 'profile', label: t.navProfile, khmerLabel: 'គណនី', icon: 'person' },
  ];

  // Strictly filter by allowedTabs based on userRole
  const navItems = allNavItems.filter((item) => allowedTabs.includes(item.id));

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="hidden min-[600px]:flex flex-col flex-shrink-0 min-[600px]:w-20 lg:w-64 h-screen sticky top-0 bg-[var(--surface-container-low)] border-r border-[var(--outline)]/10 z-30 select-none transition-all duration-300"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-3 lg:px-5 border-b border-[var(--outline)]/10 gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-extrabold text-base shadow-xs flex-shrink-0">
          HF
        </div>
        <div className="hidden lg:flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-[var(--on-surface)] tracking-tight truncate">
              {t.appName}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold uppercase">
              {userRole === 'ADMIN' ? t.admin : t.member}
            </span>
          </div>
          <span className="text-[11px] text-[var(--on-surface-variant)] truncate">
            {userRole === 'ADMIN' ? (language === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Admin Controller') : (language === 'km' ? 'វិបផតថលសមាជិក' : 'Resident Portal')}
          </span>
        </div>
      </div>

      {/* Navigation Items (Rail on tablet, Drawer on desktop) */}
      <div className="flex-1 py-4 px-2 lg:px-3 flex flex-col space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full min-h-[48px] rounded-2xl flex items-center justify-center lg:justify-start px-2 lg:px-3.5 gap-3.5 transition-all text-xs font-bold ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                  isActive ? 'scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight min-w-0">
                <span className="truncate">{item.label}</span>
                <span className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-[var(--on-surface-variant)] opacity-70'}`}>
                  {item.khmerLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* User Card & Controls Footer */}
      <div className="p-3 border-t border-[var(--outline)]/10 flex flex-col space-y-2 bg-[var(--surface-container)]/40">
        {/* User Identity Chip */}
        <div
          onClick={() => setCurrentTab('profile')}
          className="flex items-center justify-center lg:justify-start p-1.5 rounded-2xl hover:bg-[var(--surface-container)] cursor-pointer transition-colors"
        >
          <div className="w-9 h-9 min-w-[36px] rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {currentUser?.name?.slice(0, 2).toUpperCase() || currentUser?.username?.slice(0, 2).toUpperCase() || 'HF'}
          </div>
          <div className="hidden lg:flex flex-col min-w-0 ml-2.5">
            <span className="text-xs font-bold text-[var(--on-surface)] truncate">
              {currentUser?.name || currentUser?.username || 'Resident'}
            </span>
            <span className="text-[10px] text-[var(--on-surface-variant)] truncate">
              @{currentUser?.username || 'user'} · {userRole}
            </span>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center justify-around lg:justify-between pt-1 gap-1">
          {/* Theme Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
            title="Toggle Language EN / ខ្មែរ"
            className="h-10 px-2 min-h-[40px] rounded-xl flex items-center justify-center gap-1 text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] active:scale-95 transition-all text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">translate</span>
            <span className="hidden lg:inline text-[11px] uppercase">
              {language === 'en' ? 'KM' : 'EN'}
            </span>
          </button>

          {/* Sign out */}
          <button
            onClick={logout}
            title="Sign Out"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-[var(--error)] hover:bg-[var(--error-container)]/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
