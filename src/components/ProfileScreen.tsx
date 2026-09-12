import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { UserStatus } from '../types/api';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    userRole,
    members,
    updateMemberStatus,
    language,
    setLanguage,
    theme,
    toggleTheme,
    logout,
    t,
  } = useApp();

  const [diningStatus, setDiningStatus] = useState<UserStatus>(currentUser?.status || 'ACTIVE');
  const [updatingMemberId, setUpdatingMemberId] = useState<string | number | null>(null);
  const [inlineConfirmation, setInlineConfirmation] = useState<string | null>(null);
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if currentUser changes from API refetch
  useEffect(() => {
    if (currentUser?.status) {
      setDiningStatus(currentUser.status);
    }
  }, [currentUser?.status]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    };
  }, []);

  const handleUpdateStatus = async (targetId: string | number, nextStatus: UserStatus) => {
    setUpdatingMemberId(String(targetId));
    try {
      await updateMemberStatus(targetId, nextStatus);
      if (String(targetId) === String(currentUser?.id)) {
        setDiningStatus(nextStatus);
        const confMsg = nextStatus === 'ACTIVE' ? t.statusUpdatedActive : t.statusUpdatedAway;
        setInlineConfirmation(confMsg);
        if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
        confirmationTimerRef.current = setTimeout(() => {
          setInlineConfirmation(null);
        }, 3500);
      }
    } catch {
      // error handled in updateMemberStatus toast
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const isUpdatingSelf = updatingMemberId === String(currentUser?.id);

  return (
    <div className="w-full flex flex-col space-y-6 pb-28 min-[600px]:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[var(--on-surface)] tracking-tight">
              {t.accountProfile}
            </h1>
            <span className="font-normal text-xs text-[var(--on-surface-variant)] hidden sm:inline">
              / {t.accountProfileKh}
            </span>
          </div>
          <p className="text-xs text-[var(--on-surface-variant)]">
            {currentUser?.email || 'household-food-system API'}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold shadow-xs w-fit">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
          JWT Authenticated · {userRole === 'ADMIN' ? t.admin : t.member}
        </span>
      </div>

      {/* Side-by-Side Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Identity, Status & App Controls */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* User Identity Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f35] via-[#006948] to-[#004f35] text-white p-5 shadow-lg border border-white/10">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white/30 flex-shrink-0">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'HF'}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-lg font-extrabold text-white tracking-tight truncate">
                    {currentUser?.name || currentUser?.username}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                    {userRole === 'ADMIN' ? t.admin : t.member}
                  </span>
                </div>
                <span className="text-xs text-[#9ff4ca] font-medium mt-0.5 truncate">
                  @{currentUser?.username}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-[#9ff4ca]/80 mt-1.5 flex-wrap">
                  <span>ID: #{currentUser?.id}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        diningStatus === 'ACTIVE' ? 'bg-[#9ff4ca]' : 'bg-amber-300'
                      }`}
                    ></span>
                    <span>
                      {t.status}: {diningStatus === 'ACTIVE' ? t.active : (language === 'km' ? 'នៅក្រៅ' : 'Away')}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resident Dining Status Card */}
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[var(--on-surface)]">
                  {t.residentDiningStatus}
                </h3>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  {t.diningStatusDesc}
                </p>
              </div>

              {/* 1. CURRENT status prominently as a non-tappable state chip/pill */}
              <div
                role="status"
                aria-label={`Current status: ${diningStatus}`}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 cursor-default select-none pointer-events-none transition-colors duration-300 flex-shrink-0 shadow-none ${
                  diningStatus === 'ACTIVE'
                    ? 'bg-emerald-500/15 border-emerald-600/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300'
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={diningStatus}
                    initial={{ scale: 0.6, opacity: 0, rotate: -25 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.6, opacity: 0, rotate: 25 }}
                    transition={{ duration: 0.25 }}
                    className="material-symbols-outlined text-[18px] flex-shrink-0"
                  >
                    {diningStatus === 'ACTIVE' ? 'check_circle' : 'pause_circle'}
                  </motion.span>
                </AnimatePresence>
                <span>
                  {diningStatus === 'ACTIVE' ? t.active : (language === 'km' ? 'នៅក្រៅ / អសកម្ម' : 'Away / Inactive')}
                </span>
              </div>
            </div>

            {/* Inline confirmation alert on status change */}
            <AnimatePresence>
              {inlineConfirmation && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        check_circle
                      </span>
                      <span className="truncate">{inlineConfirmation}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInlineConfirmation(null)}
                      className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 text-xs p-1 rounded-lg hover:bg-emerald-600/10 transition-colors"
                      aria-label={t.close}
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2 & 5: Single Action Button or Admin-Controlled Read-Only Notice */}
            {userRole === 'ADMIN' ? (
              <div className="pt-1">
                {diningStatus === 'ACTIVE' ? (
                  /* If currently Active -> show single outlined/secondary button: icon = pause-circle, label = Mark as Away / Pause Dining */
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(currentUser?.id || 14, 'INACTIVE')}
                    disabled={updatingMemberId !== null}
                    className="w-full min-h-[48px] px-4 rounded-2xl border-2 border-amber-600/40 text-amber-800 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-xs disabled:opacity-60"
                  >
                    {isUpdatingSelf ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                    )}
                    <span>{t.markAsAway} ({t.pauseDining})</span>
                  </button>
                ) : (
                  /* If currently Away/Inactive -> show single filled/primary button: icon = check-circle, label = Mark as Active / Resume Dining */
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(currentUser?.id || 14, 'ACTIVE')}
                    disabled={updatingMemberId !== null}
                    className="w-full min-h-[48px] px-4 rounded-2xl bg-[#006948] hover:bg-[#005a3e] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-md disabled:opacity-60"
                  >
                    {isUpdatingSelf ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    )}
                    <span>{t.markAsActive} ({t.resumeDining})</span>
                  </button>
                )}
              </div>
            ) : (
              /* 5: Member view: Status is admin-controlled only -> read-only pill with info callout */
              <div className="p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 flex items-start gap-3 text-xs text-[var(--on-surface-variant)]">
                <span className="material-symbols-outlined text-[20px] text-[var(--primary)] flex-shrink-0 mt-0.5">
                  lock_person
                </span>
                <div className="space-y-1 min-w-0">
                  <span className="font-bold text-[var(--on-surface)] block">
                    {t.statusManagedByAdmin}
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    {t.statusManagedByAdminDesc}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preferences & Actions */}
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-3">
            <h3 className="text-base font-bold text-[var(--on-surface)]">
              {t.appPreferences}
            </h3>

            {/* Language Switch */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--outline)]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-container)] flex items-center justify-center text-[var(--on-surface-variant)]">
                  <span className="material-symbols-outlined text-[20px]">translate</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--on-surface)] block">
                    {t.languageSetting}
                  </span>
                  <span className="text-[11px] text-[var(--on-surface-variant)]">
                    {language === 'en' ? 'English (US)' : 'ភាសាខ្មែរ (Khmer)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
                className="min-h-[48px] min-w-[48px] px-4 rounded-xl bg-[var(--surface-container)] text-xs font-bold text-[var(--primary)] hover:bg-[var(--surface-container-high)] transition-all flex items-center justify-center"
              >
                {language === 'en' ? t.switchToKhmer : t.switchToEnglish}
              </button>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--outline)]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-container)] flex items-center justify-center text-[var(--on-surface-variant)]">
                  <span className="material-symbols-outlined text-[20px]">
                    {theme === 'light' ? 'light_mode' : 'dark_mode'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--on-surface)] block">
                    {t.appearance}
                  </span>
                  <span className="text-[11px] text-[var(--on-surface-variant)]">
                    {theme === 'light' ? t.lightMode : t.darkMode}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="min-h-[48px] min-w-[48px] px-4 rounded-xl bg-[var(--surface-container)] text-xs font-bold text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] transition-all flex items-center justify-center"
              >
                {theme === 'light' ? t.darkMode : t.lightMode}
              </button>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={logout}
              className="w-full min-h-[48px] rounded-2xl bg-[var(--error)]/10 text-[var(--error)] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[var(--error)]/20 active:scale-95 transition-all mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>{t.logout}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Household Members Management (PATCH /users/:id/status) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[var(--on-surface)]">
                  {t.householdRosterManagement}
                </h3>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  {members.length} {t.registered}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold">
                {userRole === 'ADMIN' ? t.adminControls : t.readOnlyRoster}
              </span>
            </div>

            <div className="space-y-2.5">
              {members.map((m) => {
                const isCurrent = String(m.id) === String(currentUser?.id);
                const isRowUpdating = updatingMemberId === String(m.id);

                return (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 min-w-[40px] rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center font-bold text-xs text-[var(--on-surface)] flex-shrink-0">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-[var(--on-surface)] truncate">
                            {m.name} {isCurrent && ` ${t.you}`}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-container)] text-[var(--on-surface-variant)] text-[10px] font-bold">
                            {m.role === 'ADMIN' ? t.admin : t.member}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--on-surface-variant)] truncate">
                          @{m.username} · ID #{m.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto flex-shrink-0">
                      {/* 6: Current status as colored pill */}
                      <div
                        role="status"
                        aria-label={`Member status: ${m.status}`}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border cursor-default select-none pointer-events-none transition-colors duration-300 ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 border-emerald-600/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={m.status}
                            initial={{ scale: 0.7, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.7, opacity: 0, rotate: 20 }}
                            transition={{ duration: 0.2 }}
                            className="material-symbols-outlined text-[13px] flex-shrink-0"
                          >
                            {m.status === 'ACTIVE' ? 'check_circle' : 'pause_circle'}
                          </motion.span>
                        </AnimatePresence>
                        <span>
                          {m.status === 'ACTIVE' ? t.active : (language === 'km' ? 'នៅក្រៅ' : 'Away')}
                        </span>
                      </div>

                      {/* 6: Admin single next-action button per row */}
                      {userRole === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(m.id, m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                          disabled={updatingMemberId !== null}
                          title={
                            m.status === 'ACTIVE'
                              ? `${t.markAsAway} (${m.name})`
                              : `${t.markAsActive} (${m.name})`
                          }
                          aria-label={
                            m.status === 'ACTIVE'
                              ? `${t.markAsAway} for ${m.name}`
                              : `${t.markAsActive} for ${m.name}`
                          }
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                            m.status === 'ACTIVE'
                              ? 'border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 bg-amber-500/5'
                              : 'border border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/15 bg-emerald-600/5'
                          }`}
                        >
                          {isRowUpdating ? (
                            <span className="material-symbols-outlined text-[17px] animate-spin text-[var(--primary)]">
                              sync
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">
                              {m.status === 'ACTIVE' ? 'pause_circle' : 'check_circle'}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
