import React from 'react';
import { ApiUser } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface ProfileScreenProps {
  currentUser: ApiUser | null;
  onUpdateStatus: (status: 'ACTIVE' | 'INACTIVE') => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  onUpdateStatus,
  onLogout,
  onOpenAuth,
}) => {
  const { language, toggleLanguage, setLanguage, t } = useLanguage();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (!currentUser) {
    return (
      <div className="flex flex-col w-full px-4 sm:px-6 md:px-8 pb-10 gap-y-4 max-w-xl md:max-w-2xl mx-auto">
        <div className="pt-4">
          <h1 className="text-2xl sm:text-3xl text-on-surface font-bold tracking-tight">
            {t.profile.title}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {t.profile.subtitle}
          </p>
        </div>

        <div className="mt-6 p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">account_circle</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-on-surface">{t.profile.notSignedIn}</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
            {t.profile.notSignedInDesc}
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-2 px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>{t.common.signIn} / {t.common.register}</span>
          </button>
        </div>

        {/* Preferences: Language & Theme */}
        <div className="mt-4 p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40 flex flex-col gap-4">
          <h3 className="text-sm sm:text-base font-bold text-on-surface">
            {t.common.language} & {t.common.theme}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Language Selection */}
            <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">translate</span>
                <span className="text-xs sm:text-sm font-semibold text-on-surface">{t.common.language}</span>
              </div>
              <div className="flex rounded-lg bg-surface-container p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    language === 'en' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('km')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    language === 'km' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  ខ្មែរ
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-500">
                  {isDark ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-surface">{t.common.theme}</span>
              </div>
              <div className="flex rounded-lg bg-surface-container p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    !isDark ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    isDark ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';
  const isActive = currentUser.status === 'ACTIVE';
  const userInitial = (currentUser.name || currentUser.username).charAt(0).toUpperCase();

  const handleToggleMyStatus = () => {
    const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    onUpdateStatus(nextStatus);
  };

  const fmtDate = (dStr?: string) => {
    if (!dStr) return 'N/A';
    try {
      return new Date(dStr).toLocaleDateString(language === 'km' ? 'km-KH' : undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 md:px-8 pb-10 gap-y-5 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-on-surface font-bold tracking-tight">
            {t.profile.title}
          </h1>
          <p className="text-sm text-on-surface-variant">
            {t.profile.authenticatedVia}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-error-container/20 text-error text-xs sm:text-sm font-bold hover:bg-error-container/30 active:scale-95 transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>{t.common.signOut}</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
              {userInitial}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold text-on-surface truncate">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isAdmin ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>

              <span className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                @{currentUser.username} • {currentUser.email}
              </span>
            </div>
          </div>
        </div>

        {/* Status indicator and toggle */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-on-surface">
                {t.profile.status}: {isActive ? t.common.active : t.common.inactive}
              </span>
              <span className="text-xs text-on-surface-variant">
                {isActive ? t.profile.activeHousehold : t.profile.markedInactive}
              </span>
            </div>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={handleToggleMyStatus}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                isActive
                  ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  : 'bg-primary text-on-primary hover:opacity-90'
              }`}
            >
              {isActive ? t.profile.markInactive : t.profile.markActive}
            </button>
          ) : (
            <span className="text-xs text-on-surface-variant italic">
              {t.profile.statusManagedByAdmin}
            </span>
          )}
        </div>

        {/* Detailed Account Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-surface-container-low">
            <span className="text-on-surface-variant block mb-1 text-xs">{t.profile.userId}</span>
            <span className="font-mono font-semibold text-on-surface text-sm sm:text-base">{currentUser.id}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low">
            <span className="text-on-surface-variant block mb-1 text-xs">{t.profile.joinedDate}</span>
            <span className="font-semibold text-on-surface text-sm sm:text-base">
              {fmtDate(currentUser.joined_at || currentUser.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences: Language & Theme Quick Setting */}
      <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40 flex flex-col gap-3">
        <h3 className="text-sm sm:text-base font-bold text-on-surface">
          {t.common.language} & {t.common.theme}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Language Selection */}
          <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">translate</span>
              <span className="text-xs sm:text-sm font-semibold text-on-surface">{t.common.language}</span>
            </div>
            <div className="flex rounded-lg bg-surface-container p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === 'en' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('km')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  language === 'km' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                ខ្មែរ
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-500">
                {isDark ? 'dark_mode' : 'light_mode'}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-on-surface">{t.common.theme}</span>
            </div>
            <div className="flex rounded-lg bg-surface-container p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  !isDark ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  isDark ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Switch Account Quick Actions */}
      <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40 flex flex-col gap-3">
        <h3 className="text-sm sm:text-base font-bold text-on-surface">
          {t.profile.accountSwitcher}
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          {t.profile.switchAccountDesc}
        </p>

        <button
          type="button"
          onClick={onOpenAuth}
          className="w-full h-12 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">switch_account</span>
          <span>{t.profile.switchAccountBtn}</span>
        </button>
      </div>
    </div>
  );
};