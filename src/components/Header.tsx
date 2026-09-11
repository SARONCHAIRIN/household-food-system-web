import React from 'react';
import { NavTab } from '../types';
import { ApiUser } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentTab: NavTab;
  currentUser: ApiUser | null;
  onAvatarClick: () => void;
  onOpenAuth: () => void;
  onOpenApiSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  onAvatarClick,
  onOpenAuth,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const getSubTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return `• ${t.nav.dashboard}`;
      case 'meals':
        return `• ${t.nav.meals}`;
      case 'deposits':
        return `• ${t.nav.deposits}`;
      case 'bills':
        return `• ${t.nav.bills}`;
      case 'profile':
        return `• ${t.nav.profile}`;
      default:
        return '';
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isActive = currentUser?.status === 'ACTIVE';
  const userInitial = (currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase();

  const getStatusLabel = (status?: string) => {
    if (!status) return t.common.active;
    if (status === 'ACTIVE') return t.common.active;
    if (status === 'INACTIVE') return t.common.inactive;
    if (status === 'AWAY') return t.common.away;
    return status;
  };

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-b border-surface-container-high/40 transition-colors">
      <div className="h-16 px-4 sm:px-6 md:px-8 flex items-center justify-between max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto gap-2">
        {/* Logo and App Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs">
            <span className="material-symbols-outlined text-[22px]">restaurant</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base text-on-surface truncate font-bold">
                {t.common.appName}
              </span>
              <span className="hidden sm:inline-block text-xs text-on-surface-variant font-medium">
                {getSubTitle()}
              </span>
            </div>
            <span className="text-xs text-on-surface-variant truncate">
              {currentUser
                ? `${t.common.welcome}, ${currentUser.name || currentUser.username}`
                : t.common.appTagline}
            </span>
          </div>
        </div>

        {/* Action Controls, Toggles & User Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={`Switch to ${language === 'en' ? 'Khmer' : 'English'}`}
            title={language === 'en' ? 'ប្តូរទៅជា ភាសាខ្មែរ (Switch to Khmer)' : 'Switch to English'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-surface-container-high/70 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">translate</span>
            <span className="tracking-wide">{language === 'en' ? 'ខ្មែរ' : 'EN'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? t.common.lightMode : t.common.darkMode}
            className="w-9 h-9 rounded-full flex items-center justify-center border border-surface-container-high/70 bg-surface-container-lowest hover:bg-surface-container text-on-surface transition-all shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-500 dark:text-amber-400">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {currentUser ? (
            <>
              {isAdmin && (
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">shield_person</span>
                  {t.common.admin}
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                <span className="hidden xs:inline">{getStatusLabel(currentUser.status)}</span>
              </span>

              <button
                type="button"
                onClick={onAvatarClick}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm flex items-center justify-center ring-2 ring-surface-container-lowest shadow-xs hover:opacity-90 active:scale-95 transition-all"
                aria-label="View Profile"
              >
                {userInitial}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>{t.common.signIn}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};