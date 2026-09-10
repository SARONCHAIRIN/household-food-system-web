import React from 'react';
import { ApiUser } from '../api/types';

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
  onShowToast,
}) => {
  if (!currentUser) {
    return (
      <div className="flex flex-col w-full px-screen-gutter pb-8 gap-y-4 max-w-lg mx-auto">
        <div className="pt-2">
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            User Profile
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Account identity & household settings
          </p>
        </div>

        <div className="mt-6 p-6 rounded-3xl bg-surface-container-lowest border border-surface-container-high/60 shadow-sm flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">account_circle</span>
          </div>
          <h2 className="font-title-md text-lg font-bold text-on-surface">Not Signed In</h2>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-xs leading-relaxed">
            Sign in with your username and password to manage your dinner attendance, view meal records, and check billing balances.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            <span>Sign In / Register</span>
          </button>
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
      return new Date(dStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="flex flex-col w-full px-screen-gutter pb-8 gap-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Account Profile
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Authenticated via JWT Bearer token
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container/20 text-error text-xs font-bold hover:bg-error-container/30 active:scale-95 transition-all shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="p-5 rounded-3xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40 flex flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            {userInitial}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-headline-sm text-lg font-bold text-on-surface truncate">
                {currentUser.name}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface'
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            <span className="font-body-sm text-xs text-on-surface-variant">
              @{currentUser.username} • {currentUser.email}
            </span>
          </div>
        </div>

        {/* Status indicator and toggle */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
              }`}
            />
            <div className="flex flex-col">
              <span className="font-label-md text-xs font-bold text-on-surface">
                Status: {currentUser.status}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {isActive ? 'Active household resident' : 'Marked as inactive'}
              </span>
            </div>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={handleToggleMyStatus}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isActive
                  ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  : 'bg-primary text-on-primary hover:opacity-90'
              }`}
            >
              {isActive ? 'Mark Inactive' : 'Mark Active'}
            </button>
          ) : (
            <span className="text-[11px] text-on-surface-variant italic">
              Status managed by Admin
            </span>
          )}
        </div>

        {/* Detailed Account Details */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-surface-container-low">
            <span className="text-on-surface-variant block mb-0.5">User ID</span>
            <span className="font-mono font-semibold text-on-surface">{currentUser.id}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low">
            <span className="text-on-surface-variant block mb-0.5">Joined Date</span>
            <span className="font-semibold text-on-surface">{fmtDate(currentUser.joined_at || currentUser.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Switch Account Quick Actions */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/40 flex flex-col gap-3">
        <h3 className="font-title-md text-sm font-bold text-on-surface">
          Account Switcher
        </h3>
        <p className="font-body-sm text-xs text-on-surface-variant">
          Easily sign in as another household member or an admin.
        </p>

        <button
          type="button"
          onClick={onOpenAuth}
          className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">switch_account</span>
          <span>Switch or Register Another Account</span>
        </button>
      </div>
    </div>
  );
};
