import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, parseCurrency } from '../services/apiClient';
import { getLocalDateString } from '../services/billingDateUtils';

export const MealsScreen: React.FC = () => {
  const {
    currentUser,
    members,
    dailyCosts,
    mealStatuses,
    toggleMealStatus,
    language,
    t,
    showToast,
  } = useApp();


  const todayStr = getLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  // Meal selection deadline applies only to today's meal.
  // Example deadline: 12:00 PM local device time.
  const isTodaySelected = selectedDate === todayStr;

  const mealDeadline = new Date();
  mealDeadline.setHours(12, 0, 0, 0);
  const userStatus = (
    currentUser?.status ??
    currentUser?.accountStatus ??
    currentUser?.account_status ??
    'INACTIVE'
  ).toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'AWAY';


  // Previous dates are locked.

  // Today is editable until 12:00 PM.

  // Future dates are editable.

  const isPastDate = selectedDate < todayStr;


  const isDeadlinePassed =

    isTodaySelected && new Date() >= mealDeadline;

  const mealLocked = isPastDate || isDeadlinePassed;
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
    if (userStatus !== 'ACTIVE') {
      showToast(
        language === 'km'
          ? 'គណនីរបស់អ្នកមិនអាចជ្រើសរើសអាហារបានទេ'
          : 'Your account cannot select meals.',
        'error'
      );
      return;
    }

    if (mealLocked) {
      showToast(
        language === 'km'
          ? 'អស់ពេលកំណត់សម្រាប់ជ្រើសរើសអាហារថ្ងៃនេះហើយ'
          : 'The meal selection deadline has passed.',
        'error'
      );
      return;
    }

    try {
      await toggleMealStatus(selectedDate, status);
    } catch {
      // Error is handled by AppContext
    }
  };

  // Generate recent 7 days dates strictly for date strip
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return getLocalDateString(d);
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
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] py-1.5 px-2 rounded-2xl transition-all flex-shrink-0 active:scale-95 ${isSelected
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

              {mealLocked && (
                <div className="flex items-center gap-2 rounded-2xl bg-black/15 border border-white/10 px-3 py-2.5 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-[#ffdbca]">
                    lock
                  </span>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {language === 'km'
                        ? 'ការជ្រើសរើសអាហារបានបិទហើយ'
                        : 'Meal selection is closed'}
                    </span>

                    <span className="text-[10px] text-white/60">
                      {isPastDate
                        ? language === 'km'
                          ? 'ថ្ងៃនេះបានកន្លងផុតហើយ'
                          : 'This date has already passed.'
                        : language === 'km'
                          ? 'មិនអាចកែប្រែបន្ទាប់ពីម៉ោង 12:00 PM'
                          : 'Cannot change after 12:00 PM'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons (min 48px tap targets) */}
              {/* <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={mealLocked}
                  onClick={() => handleToggle('EAT')}
                  className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${mealLocked
                    ? 'bg-white/10 text-white/40 cursor-not-allowed opacity-60'
                    : myStatus === 'EAT'
                      ? 'bg-white text-[var(--primary)] shadow-md active:scale-95'
                      : 'bg-white/15 text-white hover:bg-white/25 active:scale-95 cursor-pointer'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {mealLocked ? 'lock' : 'check_circle'}
                  </span>

                  <span>{t.eatTonight}</span>
                </button>

                <button
                  type="button"
                  disabled={mealLocked}
                  onClick={() => handleToggle('NOT_EAT')}
                  className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${mealLocked
                    ? 'bg-white/10 text-white/40 cursor-not-allowed opacity-60'
                    : myStatus === 'NOT_EAT'
                      ? 'bg-[var(--secondary)] text-white shadow-md active:scale-95'
                      : 'bg-white/15 text-white hover:bg-white/25 active:scale-95 cursor-pointer'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {mealLocked ? 'lock' : 'cancel'}
                  </span>

                  <span>{t.skipMeal}</span>
                </button>
              </div> */}
            </div>
          </div>

          {/* Meal Attendance Action */}
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--on-surface)]">
                  {language === 'km' ? 'ការជ្រើសរើសអាហារ' : 'Meal Attendance'}
                </h3>

                <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                  {myStatus === 'EAT'
                    ? language === 'km'
                      ? 'អ្នកបានជ្រើសរើសញ៉ាំ'
                      : 'You selected Eat'
                    : myStatus === 'NOT_EAT'
                      ? language === 'km'
                        ? 'អ្នកបានជ្រើសរើសមិនញ៉ាំ'
                        : 'You selected Skip'
                      : language === 'km'
                        ? 'សូមជ្រើសរើស'
                        : 'Please select your meal'}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${userStatus === 'ACTIVE'
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'bg-[var(--error)]/10 text-[var(--error)]'
                  }`}
              >
                {userStatus}
              </span>
            </div>

            {userStatus !== 'ACTIVE' ? (
              <div className="rounded-2xl bg-[var(--error)]/10 border border-[var(--error)]/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[var(--error)]">
                    lock
                  </span>

                  <div>
                    <p className="text-sm font-bold text-[var(--on-surface)]">
                      {language === 'km'
                        ? userStatus === 'AWAY'
                          ? 'អ្នកត្រូវបានកំណត់ថា AWAY'
                          : 'គណនីរបស់អ្នកមិនទាន់សកម្ម'
                        : userStatus === 'AWAY'
                          ? 'You are marked as AWAY'
                          : 'Your account is not active'}
                    </p>

                    <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                      {language === 'km'
                        ? 'អ្នកមិនអាចជ្រើសរើសអាហារបានទេ'
                        : 'You cannot select a meal.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {mealLocked && (
                  <div className="mb-4 rounded-2xl bg-[var(--error)]/10 border border-[var(--error)]/10 p-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[var(--error)]">
                        lock
                      </span>

                      <div>
                        <p className="text-xs font-bold text-[var(--on-surface)]">
                          {language === 'km'
                            ? 'ការជ្រើសរើសអាហារបានបិទហើយ'
                            : 'Meal selection is closed'}
                        </p>

                        <p className="text-[10px] text-[var(--on-surface-variant)]">
                          {isPastDate
                            ? language === 'km'
                              ? 'ថ្ងៃនេះបានកន្លងផុតហើយ'
                              : 'This date has already passed.'
                            : language === 'km'
                              ? 'មិនអាចកែប្រែបន្ទាប់ពីម៉ោង 12:00 PM'
                              : 'Cannot change after 12:00 PM'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={mealLocked}
                    onClick={() => handleToggle('EAT')}
                    className={`min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${mealLocked
                      ? 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] opacity-50 cursor-not-allowed'
                      : myStatus === 'EAT'
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {mealLocked ? 'lock' : 'check_circle'}
                    </span>

                    {language === 'km' ? 'ញ៉ាំ' : 'Eat'}
                  </button>

                  <button
                    type="button"
                    disabled={mealLocked}
                    onClick={() => handleToggle('NOT_EAT')}
                    className={`min-h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${mealLocked
                      ? 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] opacity-50 cursor-not-allowed'
                      : myStatus === 'NOT_EAT'
                        ? 'bg-[var(--error)] text-white shadow-md'
                        : 'bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {mealLocked ? 'lock' : 'cancel'}
                    </span>

                    {language === 'km' ? 'មិនញ៉ាំ' : 'Skip'}
                  </button>
                </div>
              </>
            )}
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
                        className={`px-3 py-1 rounded-full font-bold text-xs flex-shrink-0 ml-2 ${isEater
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
