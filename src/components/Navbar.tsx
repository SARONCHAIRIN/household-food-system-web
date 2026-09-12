import React from 'react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { currentTab, setCurrentTab, language, setLanguage, theme, toggleTheme, currentUser, userRole, t } = useApp();

  const getSubTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return `${t.appName} • ${t.navDashboard}`;
      case 'meals':
        return `${t.appName} • ${t.navMeals}`;
      case 'deposits':
        return `${t.appName} • ${t.navDeposits}`;
      case 'bills':
        return `${t.appName} • ${t.navBills}`;
      case 'profile':
        return `${t.appName} • ${t.navProfile}`;
      default:
        return t.appName;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--outline)]/10 shadow-[0_1px_8px_rgba(17,28,45,0.04)]">
      <div className="w-full max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none"
          onClick={() => setCurrentTab('dashboard')}
        >
          <img
            src="https://lh3.googleusercontent.com/aida/AEtjO1WVIylQnD56T2_Oq0fZNL8MubrEY2Awppu4Rp9k2t8FdgRrp7MtJvPuSaC-Z9y5bVEFP54h3FXsA7FUjrzNmTbLhJC8pEj0BQsq8pwX48povC6n6T6b8OY9qgxKF3yLvRJN2BEeZmozusduiHjC3xeVyqIjBB-Lk7KKDAJwloqfOqjsv5AaBCo6ktlhaz_Rp2UORs4oqB2ZFIRTdWC1E-v5AN2Y8JpKO78jR0vOQzIYHd3WC2VtP9ukl8A"
            alt="Household Food Logo"
            className="h-8 w-8 object-contain rounded-lg flex-shrink-0 bg-white/80 shadow-xs"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-[var(--on-surface)] truncate tracking-tight">
                {t.appName}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold leading-none uppercase">
                {userRole === 'ADMIN' ? t.admin : t.member}
              </span>
            </div>
            <span className="text-xs text-[var(--on-surface-variant)] truncate hidden sm:inline">
              {getSubTitle()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language Switcher Pill */}
          <button
            aria-label="Toggle Language"
            onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
            className="h-10 px-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-[var(--surface-container)] text-[var(--on-surface-variant)] active:scale-95 transition-all text-xs font-semibold shadow-xs"
          >
            <span className={`px-1 rounded ${language === 'en' ? 'text-[var(--primary)] font-bold' : 'opacity-60'}`}>
              EN
            </span>
            <span className="text-[var(--outline)] opacity-40 mx-0.5">|</span>
            <span className={`px-1 rounded ${language === 'km' ? 'text-[var(--primary)] font-bold' : 'opacity-60'}`}>
              ខ្មែរ
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="w-10 h-10 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] active:scale-95 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'light' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* User Profile Avatar */}
          <button
            aria-label="User Profile"
            onClick={() => setCurrentTab('profile')}
            className="w-10 h-10 min-w-[48px] min-h-[48px] rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[var(--primary)]/25 active:scale-95 transition-transform flex-shrink-0 shadow-xs"
          >
            {currentUser?.name?.slice(0, 2).toUpperCase() || currentUser?.username?.slice(0, 2).toUpperCase() || 'HF'}
          </button>
        </div>
      </div>
    </header>
  );
};
