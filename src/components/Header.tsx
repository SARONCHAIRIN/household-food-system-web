import React from 'react';
import { NavTab } from '../types';
import { ApiUser } from '../api/types';
import { getBaseUrl, LIVE_API_URL } from '../api/client';

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
  onOpenApiSettings,
}) => {
  const getSubTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return '• Dashboard';
      case 'meals':
        return '• Meals';
      case 'deposits':
        return '• Deposits';
      case 'bills':
        return '• Bills';
      case 'profile':
        return '• Profile';
      default:
        return '';
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isActive = currentUser?.status === 'ACTIVE';
  const userInitial = (currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] border-b border-surface-container-high/40">
      <div className="h-16 px-screen-gutter flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs">
            <span className="material-symbols-outlined text-[20px]">restaurant</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-title-md text-title-md text-on-surface truncate font-bold">Household Food</span>
              <span className="hidden sm:inline-block font-label-sm text-label-sm text-on-surface-variant">
                {getSubTitle()}
              </span>
            </div>
            <span className="font-body-sm text-xs text-on-surface-variant truncate">
              {currentUser ? `Welcome, ${currentUser.name || currentUser.username}` : 'Apartment Shared Pantry'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentUser ? (
            <>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[11px]">shield_person</span>
                  ADMIN
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-sm text-xs font-bold ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                {currentUser.status || 'ACTIVE'}
              </span>
              <button
                type="button"
                onClick={onAvatarClick}
                className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center ring-2 ring-surface-container-lowest shadow-xs hover:opacity-90 active:scale-95 transition-all"
                aria-label="View Profile"
              >
                {userInitial}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold shadow-xs hover:bg-primary-container transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">login</span>
              <span>Sign In</span>
            </button>
          )}

          {onOpenApiSettings && (
            <button
              type="button"
              onClick={onOpenApiSettings}
              title={`API Server: ${getBaseUrl()}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-outline-variant/60 bg-surface-container text-on-surface-variant hover:text-primary text-[10px] font-mono font-bold transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">API:</span>
              <span>{getBaseUrl() === LIVE_API_URL ? 'Cloud' : 'Local'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
