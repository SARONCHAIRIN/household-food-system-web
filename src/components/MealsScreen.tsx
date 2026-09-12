import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, parseCurrency } from '../services/apiClient';

export const MealsScreen: React.FC = () => {
  const {
    currentUser,
    members,
    dailyCosts,
    mealStatuses,
    toggleMealStatus,
    language,
    t,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filter daily cost for selected date from GET /daily-costs
  const costForDate = dailyCosts.find((c) => c.date.startsWith(selectedDate));
  const foodPrice = parseCurrency(costForDate?.food_price ?? costForDate?.foodPrice ?? 0);
  const ingredientPrice = parseCurrency(
    costForDate?.ingredient_price ?? costForDate?.ingredientPrice ?? 0
  );
  const totalCostForDate = foodPrice + ingredientPrice;

  // Filter statuses for selected date from GET /meal-statuses
  const recordsForDate = mealStatuses.filter((s) => s.date.startsWith(selectedDate));
  const eatersForDate = recordsForDate.filter((s) => s.status === 'EAT');
  const eatersCount = eatersForDate.length;

  // Current user's status for selected date
  const myRecordForDate = recordsForDate.find(
    (s) =>
      String(s.memberId) === String(currentUser?.id) ||
      String(s.member_id) === String(currentUser?.id)
  );
  const myStatus = myRecordForDate ? myRecordForDate.status : null;

  // Cost per eater for food pool on this date
  const costPerEater = eatersCount > 0 ? foodPrice / eatersCount : 0;

  const handleToggle = async (status: 'EAT' | 'NOT_EAT') => {
    try {
      await toggleMealStatus(selectedDate, status);
    } catch {
      // handled
    }
  };

  // Generate recent 7 days dates strictly for date strip
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="w-full flex flex-col space-y-6 pb-28 min-[600px]:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[var(--on-surface)] tracking-tight">
              {t.mealAttendance}
            </h1>
            <span className="font-normal text-xs text-[var(--on-surface-variant)] hidden sm:inline">
              / {t.mealAttendanceKh}
            </span>
          </div>
          <p className="text-xs text-[var(--on-surface-variant)]">
            {t.mealsSubtitle}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold shadow-xs w-fit">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
          GET /meal-statuses
        </span>
      </div>

      {/* Date Strip Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {dateOptions.map((dateStr) => {
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          const dayName = new Date(dateStr).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', { weekday: 'short' });
          const dayNum = dateStr.slice(8);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] py-1.5 px-2 rounded-2xl transition-all flex-shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-[var(--primary)] text-white shadow-sm font-bold'
                  : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                {isToday ? t.today : dayName}
              </span>
              <span className="text-base font-extrabold">{dayNum}</span>
            </button>
          );
        })}

        {/* Custom date input */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="min-h-[56px] px-3 rounded-2xl bg-[var(--surface-container-low)] text-xs font-bold text-[var(--on-surface)] outline-none border border-[var(--outline)]/10 flex-shrink-0"
        />
      </div>

      {/* Side-by-Side Responsive Layout on tablet & desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Meal Card & User Attendance Action */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Dinner Info Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f35] via-[#006948] to-[#004f35] text-white p-5 shadow-lg border border-white/10">
            <div className="relative z-10 flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9ff4ca]">
                    {t.date}: {selectedDate}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {eatersCount} {t.dinersConfirmed}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  {totalCostForDate > 0 ? formatCurrency(totalCostForDate) : t.noCost}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {formatCurrency(costPerEater)}
                  </span>
                  <span className="text-xs font-bold text-[#9ff4ca]">{t.perDiner}</span>
                </div>
                <p className="text-xs text-[#9ff4ca]/80 mt-1">
                  {t.foodPrep}: {formatCurrency(foodPrice)} | {t.ingredientPantry}: {formatCurrency(ingredientPrice)}
                </p>
              </div>

              {/* Action Buttons (min 48px tap targets) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleToggle('EAT')}
                  className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    myStatus === 'EAT'
                      ? 'bg-white text-[var(--primary)] shadow-md'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>{t.eatTonight}</span>
                </button>

                <button
                  onClick={() => handleToggle('NOT_EAT')}
                  className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    myStatus === 'NOT_EAT'
                      ? 'bg-[var(--secondary)] text-white shadow-md'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                  <span>{t.skipMeal}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Ledger */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[var(--on-surface)]">
                  {t.attendanceLedger} ({selectedDate})
                </h3>
                <span className="text-xs text-[var(--on-surface-variant)]">
                  {t.liveEntriesFromApi}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] text-xs font-bold">
                {recordsForDate.length} {t.records}
              </span>
            </div>

            {recordsForDate.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--on-surface-variant)]">
                {t.noAttendanceRecords}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recordsForDate.map((rec) => {
                  const mId = rec.memberId || rec.member_id;
                  const matchedMember = members.find((m) => String(m.id) === String(mId));
                  const isEater = rec.status === 'EAT';
                  const isMe = String(mId) === String(currentUser?.id);

                  return (
                    <div
                      key={rec.id || mId}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 min-w-[40px] rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center font-bold text-xs text-[var(--on-surface)] flex-shrink-0">
                          {matchedMember?.name?.slice(0, 2).toUpperCase() || 'MB'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-[var(--on-surface)] truncate">
                            {matchedMember?.name || `Member #${mId}`} {isMe && ` ${t.you}`}
                          </span>
                          <span className="text-[11px] text-[var(--on-surface-variant)] truncate">
                            @{matchedMember?.username || 'resident'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full font-bold text-xs flex-shrink-0 ml-2 ${
                          isEater
                            ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                            : 'bg-[var(--error)]/15 text-[var(--error)]'
                        }`}
                      >
                        {isEater ? t.eating : t.skipping}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
