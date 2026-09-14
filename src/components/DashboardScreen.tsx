import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseCurrency } from '../services/apiClient';
import { getLocalDateString } from '../services/billingDateUtils';
import { getMealConfirmationType } from '../types/api';

const DEFAULT_EXCHANGE_RATE = 4000;

/**
 * Format amounts cleanly as KHR (៛)
 */
const formatKHR = (amount: number | string): string => {
  const num = Math.round(Number(amount) || 0);
  return `${num.toLocaleString()} ៛`;
};

/**
 * Format amounts cleanly as USD ($)
 */
const formatUSD = (amount: number | string): string => {
  const num = Number(amount) || 0;
  return `$${num.toFixed(2)}`;
};

export const DashboardScreen: React.FC = () => {
  const {
    currentUser,
    userRole,
    members,
    dailyCosts,
    mealStatuses,
    toggleMealStatus,
    addDailyExpense,
    setCurrentTab,
    loading,
    language,
    t,
    showToast,
  } = useApp();

  // Today's real local device date in YYYY-MM-DD
  const todayStr = getLocalDateString(new Date());

  // User's attendance for today from GET /meal-statuses
  const myTodayRecord = mealStatuses.find(
    (m) =>
      m.date.startsWith(todayStr) &&
      (String(m.memberId) === String(currentUser?.id) ||
        String(m.member_id) === String(currentUser?.id))
  );

  const isEating = myTodayRecord ? myTodayRecord.status === 'EAT' : null;
  const myTodayConfirmationType = getMealConfirmationType(myTodayRecord);

  // Meal attendance count for today
  const todayEaters = mealStatuses.filter(
    (m) => m.date.startsWith(todayStr) && m.status === 'EAT'
  ).length;

  // Today's logged cost (if any) from GET /daily-costs
  const todayCost = dailyCosts.find((c) => c.date.startsWith(todayStr));

  // Compute live pool sums strictly from GET /daily-costs (all stored numbers handled in KHR)
  const totalFoodPrep = dailyCosts.reduce(
    (acc, c) => acc + parseCurrency(c.food_price ?? c.foodPrice ?? 0),
    0
  );
  const totalPantry = dailyCosts.reduce(
    (acc, c) => acc + parseCurrency(c.ingredient_price ?? c.ingredientPrice ?? 0),
    0
  );
  const totalPool = totalFoodPrep + totalPantry;

  const foodSharePct =
    totalPool > 0 ? ((totalFoodPrep / totalPool) * 100).toFixed(1) : '0.0';
  const pantrySharePct =
    totalPool > 0 ? ((totalPantry / totalPool) * 100).toFixed(1) : '0.0';

  // Add Expense Form State (admin only)
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [foodPrice, setFoodPrice] = useState('');
  const [ingredientPrice, setIngredientPrice] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

  // Check if a record already exists for the actively selected date in GET /daily-costs
  const existingCostForDate = dailyCosts.find(
    (c) => c.date && c.date.split('T')[0] === expenseDate
  );

  // Meal selection deadline: 12:00 PM local device time
  const mealDeadline = new Date();
  mealDeadline.setHours(12, 0, 0, 0);
  const mealLocked = new Date() >= mealDeadline;

  const userStatus = (
    currentUser?.status ??
    currentUser?.accountStatus ??
    currentUser?.account_status ??
    'INACTIVE'
  ).toUpperCase();

  const handleDinnerSelection = async (status: 'EAT' | 'NOT_EAT') => {
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
      await toggleMealStatus(todayStr, status);
    } catch {
      // handled by AppContext
    }
  };

  const handleSaveExpense = async () => {
    const fPrice = parseFloat(foodPrice) || 0;
    const iPrice = parseFloat(ingredientPrice) || 0;
    if (fPrice <= 0 && iPrice <= 0) {
      showToast(
        language === 'km'
          ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់សម្រាប់ម្ហូប ឬគ្រឿងទេស (៛)'
          : 'Please enter an amount for food or ingredients (KHR)',
        'error'
      );
      return;
    }

    if (!expenseDate) {
      showToast(
        language === 'km'
          ? 'សូមជ្រើសរើសកាលបរិច្ឆេទត្រឹមត្រូវ'
          : 'Please select a valid date',
        'error'
      );
      return;
    }

    if (existingCostForDate && !showDuplicateConfirm) {
      setShowDuplicateConfirm(true);
      return;
    }

    setSavingExpense(true);
    try {
      await addDailyExpense(fPrice, iPrice, expenseDate);
      setFoodPrice('');
      setIngredientPrice('');
      setExpenseDate(getLocalDateString(new Date()));
      setShowDuplicateConfirm(false);
    } catch {
      // handled
    } finally {
      setSavingExpense(false);
    }
  };

  const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
  const registeredCount = members.length;

  return (
    <div className="w-full flex flex-col space-y-6 pb-28 min-[600px]:pb-8">
      {/* Apartment Status & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
              LIVE API · {activeCount} {t.active}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] text-xs font-semibold">
              {todayStr}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--on-surface)] tracking-tight truncate">
            {t.greeting}, {currentUser?.name || currentUser?.username || 'Resident'} 👋
          </h1>
          <p className="text-xs text-[var(--on-surface-variant)] flex items-center gap-1.5 mt-0.5">
            <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">
              groups
            </span>
            {activeCount} {t.activeHouseholdMembers} · {registeredCount} {t.registered}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'ADMIN' && (
            <button
              onClick={() => {
                const sheet = document.getElementById('expense-sheet');
                if (sheet) sheet.scrollIntoView({ behavior: 'smooth' });
              }}
              className="min-h-[48px] px-4 rounded-full bg-[var(--secondary)] hover:bg-[var(--secondary-container)] text-white text-xs font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{t.addExpense}</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Top Grid: Live Food Pool & Tonight's Dinner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Primary Live Food Pool Card (KHR Primary, USD Subtext) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f35] via-[#006948] to-[#004f35] text-white p-5 shadow-lg border border-white/10 flex flex-col justify-between">
          <div className="relative z-10 flex flex-col space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[#9ff4ca]">
                  <span className="material-symbols-outlined text-[20px]">savings</span>
                  <span className="text-xs font-bold tracking-wider uppercase">
                    {t.liveFoodPoolTotal}
                  </span>
                </div>
                <span className="text-xs text-[#9ff4ca]/85">
                  {t.liveFoodPoolTotalKh}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-[#9ff4ca] text-xs font-bold">
                {dailyCosts.length} {t.cyclesCount}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {formatKHR(totalPool)}
                </span>
                <span className="text-sm font-bold text-[#9ff4ca]">
                  ({formatUSD(totalPool / DEFAULT_EXCHANGE_RATE)})
                </span>
              </div>
              <p className="text-xs text-[#9ff4ca]/80 mt-1">
                {language === 'km'
                  ? `ទិន្នន័យជាក់ស្តែងពី GET /daily-costs (អត្រាប្តូរប្រាក់ $1 = ${DEFAULT_EXCHANGE_RATE.toLocaleString()} ៛)`
                  : `Aggregated live totals from GET /daily-costs ($1 = ${DEFAULT_EXCHANGE_RATE.toLocaleString()} KHR)`}
              </p>
            </div>

            {/* Breakdown Tiles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between border border-white/10">
                <div className="flex items-center justify-between text-[#9ff4ca] mb-1">
                  <span className="text-xs font-bold">{t.foodPrep}</span>
                  <span className="material-symbols-outlined text-[18px]">restaurant</span>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">
                    {formatKHR(totalFoodPrep)}
                  </div>
                  <div className="text-[11px] text-[#9ff4ca]/80 mt-0.5">
                    {formatUSD(totalFoodPrep / DEFAULT_EXCHANGE_RATE)} · {foodSharePct}%
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between border border-white/10">
                <div className="flex items-center justify-between text-[#ffdbca] mb-1">
                  <span className="text-xs font-bold">{t.pantryGroceries}</span>
                  <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-white">
                    {formatKHR(totalPantry)}
                  </div>
                  <div className="text-[11px] text-[#ffdbca]/80 mt-0.5">
                    {formatUSD(totalPantry / DEFAULT_EXCHANGE_RATE)} · {pantrySharePct}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dinner Attendance & Status Card */}
        <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 text-[var(--secondary)]">
                  <span className="material-symbols-outlined text-[20px]">soup_kitchen</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {t.tonightsDinner}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[var(--on-surface)] mt-1 truncate">
                  {todayCost
                    ? `${t.costLogged}: ${t.foodPrep} ${formatKHR(parseCurrency(todayCost.food_price ?? todayCost.foodPrice ?? 0))} | ${t.ingredientPantry} ${formatKHR(parseCurrency(todayCost.ingredient_price ?? todayCost.ingredientPrice ?? 0))}`
                    : t.noCostLoggedToday}
                </h2>
                <span className="text-xs text-[var(--on-surface-variant)]">
                  {t.date}: {todayStr}
                </span>
              </div>

              <span className="px-3 py-1 rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] text-xs font-bold flex-shrink-0">
                {todayEaters} {t.confirmedDining}
              </span>
            </div>

            {/* Attendance Badges */}
            <div className="pt-3 pb-1">
              {myTodayConfirmationType === 'AUTO' && (
                <div className="flex flex-col space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs ring-1 ring-amber-500/20">
                      <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400 animate-pulse">
                        bolt
                      </span>
                      <span>{t.autoConfirmedBadge}</span>
                    </span>
                    <span className="text-[11px] font-bold text-[var(--on-surface-variant)] px-2 py-0.5 rounded-lg bg-[var(--surface-container)]">
                      {isEating ? `🍽️ ${t.eating}` : `🚫 ${t.skipping}`}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-xs">
                    <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                      info
                    </span>
                    <div className="flex flex-col space-y-0.5">
                      <p className="font-bold leading-relaxed">
                        {t.autoConfirmedTooltip}
                      </p>
                      <p className="text-[11px] text-[var(--on-surface-variant)]">
                        {t.overrideStatusHint}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {myTodayConfirmationType === 'MANUAL' && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      <span>{t.manualConfirmedBadge}</span>
                    </span>
                    <span className="text-xs font-bold text-[var(--on-surface)]">
                      {isEating ? t.eating : t.skipping}
                    </span>
                  </div>
                  {myTodayRecord?.confirmed_at && (
                    <span className="text-[10px] text-[var(--on-surface-variant)] font-mono">
                      {new Date(myTodayRecord.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}

              {myTodayRecord === undefined && (
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 text-xs text-[var(--on-surface-variant)]">
                  <span className="material-symbols-outlined text-[18px] text-[var(--on-surface-variant)]">
                    schedule
                  </span>
                  <span>{t.noResponseBadge} · {language === 'km' ? 'សូមជ្រើសរើសវត្តមានខាងក្រោម' : 'Please select your dinner preference below'}</span>
                </div>
              )}
            </div>

            {mealLocked && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-gray-100 border border-gray-200 px-3 py-2.5 text-xs text-gray-500">
                <span className="material-symbols-outlined text-[18px]">
                  lock
                </span>
                <div className="flex flex-col">
                  <span className="font-bold">
                    {language === 'km'
                      ? 'ការជ្រើសរើសអាហារបានបិទហើយ'
                      : 'Meal selection is closed'}
                  </span>
                  <span className="text-[10px]">
                    {language === 'km'
                      ? 'មិនអាចកែប្រែវត្តមានបន្ទាប់ពីម៉ោង 12:00 PM'
                      : 'You cannot change your meal after 12:00 PM.'}
                  </span>
                </div>
              </div>
            )}

            {/* Attendance Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={mealLocked || userStatus !== 'ACTIVE'}
                onClick={() => handleDinnerSelection('EAT')}
                className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${mealLocked
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                    : isEating === true
                      ? 'bg-[var(--primary)] text-white shadow-md ring-2 ring-[var(--primary)] active:scale-95 cursor-pointer'
                      : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] active:scale-95 cursor-pointer'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {mealLocked ? 'lock' : 'check_circle'}
                </span>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span>{t.eatTonight}</span>
                  <span className="text-[10px] opacity-80">{t.eatTonightKh}</span>
                </div>
              </button>

              <button
                type="button"
                disabled={mealLocked}
                onClick={() => handleDinnerSelection('NOT_EAT')}
                className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${mealLocked
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                    : isEating === false
                      ? 'bg-[var(--secondary)] text-white shadow-md ring-2 ring-[var(--secondary)] active:scale-95 cursor-pointer'
                      : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] active:scale-95 cursor-pointer'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {mealLocked ? 'lock' : 'cancel'}
                </span>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span>{t.skipMeal}</span>
                  <span className="text-[10px] opacity-80">{t.skipMealKh}</span>
                </div>
              </button>
            </div>
          </div>

          <div className="text-xs text-[var(--on-surface-variant)] text-center py-1.5 px-3 bg-[var(--surface-container-low)] rounded-xl flex items-center justify-center gap-1.5">
            {isEating === true && (
              <span>
                {language === 'km' ? '✅ វត្តមានរបស់អ្នកត្រូវបានកត់ត្រា៖ ញ៉ាំ' : '✅ Your attendance is recorded: EAT'}{' '}
                <span className="font-semibold opacity-85">
                  ({myTodayConfirmationType === 'AUTO' ? t.autoConfirmedBadgeShort : t.manualConfirmedBadgeShort})
                </span>
              </span>
            )}
            {isEating === false && (
              <span>
                {language === 'km' ? '❌ វត្តមានរបស់អ្នកត្រូវបានកត់ត្រា៖ មិនញ៉ាំ' : '❌ Your attendance is recorded: NOT_EAT'}{' '}
                <span className="font-semibold opacity-85">
                  ({myTodayConfirmationType === 'AUTO' ? t.autoConfirmedBadgeShort : t.manualConfirmedBadgeShort})
                </span>
              </span>
            )}
            {isEating === null && (
              <span>
                {language === 'km' ? '⏳ មិនទាន់មានការឆ្លើយតបសម្រាប់ថ្ងៃនេះនៅឡើយទេ' : '⏳ No response submitted for today yet.'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Household Members List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--on-surface)]">
              {t.householdMembers}
            </h3>
            <p className="text-xs text-[var(--on-surface-variant)]">
              {members.length} {t.registered}
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('profile')}
            className="min-h-[48px] px-3 text-xs font-bold text-[var(--primary)] flex items-center gap-1 hover:underline"
          >
            <span>{t.manage}</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {loading && members.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--surface-container-lowest)] text-center text-xs text-[var(--on-surface-variant)]">
            {t.loading}
          </div>
        ) : members.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--surface-container-lowest)] text-center text-xs text-[var(--on-surface-variant)]">
            {language === 'km' ? 'មិនមានទិន្នន័យសមាជិកទេ' : 'No members returned from GET /members'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {members.map((m) => {
              const isCurrent = String(m.id) === String(currentUser?.id) || m.username === currentUser?.username;
              const mealsCount = mealStatuses.filter(
                (s) =>
                  (String(s.memberId) === String(m.id) ||
                    String(s.member_id) === String(m.id)) &&
                  s.status === 'EAT'
              ).length;

              return (
                <div
                  key={m.id}
                  className="rounded-2xl bg-[var(--surface-container-lowest)] p-3.5 flex items-center justify-between gap-3 shadow-xs border border-[var(--outline)]/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 min-w-[44px] rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center font-bold text-xs text-[var(--on-surface)] flex-shrink-0">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[var(--on-surface)] truncate">
                          {m.name} {isCurrent && ` ${t.you}`}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-container)] text-[var(--on-surface-variant)] text-[10px] font-bold">
                          {m.role === 'ADMIN' ? t.admin : t.member}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--on-surface-variant)] mt-0.5">
                        <span>@{m.username}</span>
                        <span>•</span>
                        <span>{mealsCount} {language === 'km' ? 'ពេល' : 'meals'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {(() => {
                      const memberToday = mealStatuses.find(
                        (s) =>
                          s.date.startsWith(todayStr) &&
                          (String(s.memberId) === String(m.id) || String(s.member_id) === String(m.id))
                      );
                      if (!memberToday) return null;
                      const memberConf = getMealConfirmationType(memberToday);
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${memberConf === 'AUTO'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            }`}
                          title={memberConf === 'AUTO' ? t.autoConfirmedTooltip : t.manualConfirmedTooltip}
                        >
                          <span className="material-symbols-outlined text-[11px]">
                            {memberConf === 'AUTO' ? 'bolt' : 'check'}
                          </span>
                          <span>
                            {memberToday.status === 'EAT' ? t.eating : t.skipping} · {memberConf === 'AUTO' ? t.autoConfirmedTag : t.userChoiceTag}
                          </span>
                        </span>
                      );
                    })()}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${m.status === 'ACTIVE'
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)]'
                        }`}
                    >
                      {m.status === 'ACTIVE' ? t.active : t.inactive}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Daily Costs List (KHR Primary) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--on-surface)]">
              {t.recentDailyCosts}
            </h3>
            <p className="text-xs text-[var(--on-surface-variant)]">
              {dailyCosts.length} {t.records}
            </p>
          </div>
        </div>

        {dailyCosts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--surface-container-lowest)] text-center text-xs text-[var(--on-surface-variant)] border border-[var(--outline)]/10">
            {t.noDailyCosts}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dailyCosts.slice(0, 6).map((cost) => {
              const fPrice = parseCurrency(cost.food_price ?? cost.foodPrice ?? 0);
              const iPrice = parseCurrency(cost.ingredient_price ?? cost.ingredientPrice ?? 0);
              const total = fPrice + iPrice;
              const dateStr = cost.date ? cost.date.split('T')[0] : 'N/A';

              return (
                <div
                  key={cost.id}
                  className="rounded-2xl bg-[var(--surface-container-lowest)] p-3.5 flex items-center justify-between gap-3 shadow-xs border border-[var(--outline)]/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[var(--surface-container)] flex items-center justify-center text-[var(--primary)] flex-shrink-0 font-bold text-xs">
                      <span className="material-symbols-outlined text-[20px]">
                        receipt
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[var(--on-surface)] truncate">
                        {dateStr}
                      </span>
                      <span className="text-[11px] text-[var(--on-surface-variant)] truncate">
                        {t.foodPrep} {formatKHR(fPrice)} | {t.ingredientPantry} {formatKHR(iPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-[var(--on-surface)] block">
                      {formatKHR(total)}
                    </span>
                    <span className="block text-[10px] font-bold text-[var(--primary)]">
                      ({formatUSD(total / DEFAULT_EXCHANGE_RATE)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POST /daily-costs Form (Admin only, KHR Input with USD Estimate) */}
      {userRole === 'ADMIN' ? (
        <div
          id="expense-sheet"
          className="rounded-3xl bg-[var(--surface-container)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[var(--secondary)]/15 flex items-center justify-center text-[var(--secondary)]">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--on-surface)]">
                  {language === 'km' ? 'កត់ត្រាចំណាយប្រចាំថ្ងៃជាប្រាក់រៀល (អ្នកគ្រប់គ្រង)' : 'Record Daily Cost in KHR (Admin)'}
                </h4>
                <p className="text-[11px] font-semibold text-[var(--primary)]">
                  POST /daily-costs {expenseDate ? `(${expenseDate})` : ''}
                </p>
              </div>
            </div>

            {expenseDate === todayStr ? (
              <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold">
                {t.today}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setExpenseDate(todayStr);
                  setShowDuplicateConfirm(false);
                }}
                className="text-[11px] font-bold text-[var(--secondary)] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">today</span>
                {language === 'km' ? 'កំណត់ជាថ្ងៃនេះ' : 'Reset to Today'}
              </button>
            )}
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--on-surface-variant)] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[var(--primary)]">event</span>
                <span>{t.date}</span>
              </label>
              <span className="text-[11px] text-[var(--on-surface-variant)]">
                {language === 'km' ? 'អាចកែប្រែដោយអ្នកគ្រប់គ្រង' : 'Editable by admin (past/future allowed)'}
              </span>
            </div>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => {
                setExpenseDate(e.target.value);
                setShowDuplicateConfirm(false);
              }}
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container-lowest)] text-[var(--on-surface)] font-bold text-sm outline-none shadow-xs border border-transparent focus:border-[var(--primary)] transition-all"
            />
          </div>

          {/* Duplicate Cost Warning Banner */}
          {existingCostForDate && (
            <div className="p-3.5 rounded-2xl bg-[var(--error-container)]/30 border border-[var(--error)]/30 text-[var(--error)] text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>{language === 'km' ? 'ការព្រមាន៖ កំណត់ត្រាត្រួតគ្នា' : 'Duplicate Record Warning'}</span>
              </div>
              <p className="leading-relaxed">
                {language === 'km'
                  ? `បានកត់ត្រាចំណាយសម្រាប់ ${expenseDate} រួចហើយ៖ ម្ហូប ${formatKHR(parseCurrency(existingCostForDate.food_price ?? existingCostForDate.foodPrice ?? 0))} / គ្រឿងទេស ${formatKHR(parseCurrency(existingCostForDate.ingredient_price ?? existingCostForDate.ingredientPrice ?? 0))}។`
                  : `A cost record already exists for ${expenseDate}: Food ${formatKHR(parseCurrency(existingCostForDate.food_price ?? existingCostForDate.foodPrice ?? 0))} / Ingredient ${formatKHR(parseCurrency(existingCostForDate.ingredient_price ?? existingCostForDate.ingredientPrice ?? 0))}.`}
              </p>
            </div>
          )}

          {/* Input Fields in KHR (៛) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--on-surface-variant)]">
                  {t.foodPrep} (៛)
                </label>
                {foodPrice && (
                  <span className="text-[11px] font-bold text-[var(--primary)]">
                    ≈ {formatUSD(parseFloat(foodPrice) / DEFAULT_EXCHANGE_RATE)}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="500"
                value={foodPrice}
                onChange={(e) => setFoodPrice(e.target.value)}
                placeholder="40000"
                className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container-lowest)] text-[var(--on-surface)] font-bold text-sm outline-none shadow-xs"
              />
              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {['10000', '20000', '40000', '50000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFoodPrice(val)}
                    className="py-1 rounded-xl bg-[var(--surface-container-lowest)] text-[10px] font-bold text-[var(--on-surface-variant)] hover:bg-[var(--primary)] hover:text-white transition-all"
                  >
                    +{(parseInt(val, 10) / 1000)}k ៛
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[var(--on-surface-variant)]">
                  {t.ingredientPantry} (៛)
                </label>
                {ingredientPrice && (
                  <span className="text-[11px] font-bold text-[var(--primary)]">
                    ≈ {formatUSD(parseFloat(ingredientPrice) / DEFAULT_EXCHANGE_RATE)}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="500"
                value={ingredientPrice}
                onChange={(e) => setIngredientPrice(e.target.value)}
                placeholder="10000"
                className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container-lowest)] text-[var(--on-surface)] font-bold text-sm outline-none shadow-xs"
              />
              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {['5000', '10000', '20000', '30000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setIngredientPrice(val)}
                    className="py-1 rounded-xl bg-[var(--surface-container-lowest)] text-[10px] font-bold text-[var(--on-surface-variant)] hover:bg-[var(--primary)] hover:text-white transition-all"
                  >
                    +{(parseInt(val, 10) / 1000)}k ៛
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveExpense}
            disabled={savingExpense || !expenseDate}
            className={`w-full min-h-[48px] rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50 ${existingCostForDate
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[var(--secondary)] hover:bg-[var(--secondary-container)]'
              }`}
          >
            {savingExpense ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
            ) : existingCostForDate ? (
              <span className="material-symbols-outlined text-[20px]">warning</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">add</span>
            )}
            <span>
              {savingExpense
                ? t.loading
                : existingCostForDate
                  ? language === 'km'
                    ? `ពិនិត្យទិន្នន័យត្រួតគ្នា (${expenseDate})`
                    : `Review Duplicate for ${expenseDate}`
                  : language === 'km'
                    ? `រក្សាទុកចំណាយសម្រាប់ ${expenseDate}`
                    : `Save Cost for ${expenseDate}`}
            </span>
          </button>
        </div>
      ) : null}

      {/* Duplicate Record Explicit Confirmation Modal */}
      {showDuplicateConfirm && existingCostForDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--surface-container)] rounded-3xl p-6 shadow-2xl border border-[var(--outline)]/15 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--on-surface)]">
                  {t.confirmDuplicateCost}
                </h3>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  POST /daily-costs ({expenseDate})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-[var(--outline)]/10 pb-2">
                <span className="text-[var(--on-surface-variant)]">{t.date}:</span>
                <span className="font-extrabold text-[var(--on-surface)]">{expenseDate}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--on-surface-variant)] font-semibold">
                  {language === 'km' ? 'កំណត់ត្រាដែលមានស្រាប់៖' : 'Existing Logged Record:'}
                </span>
                <div className="p-2 rounded-xl bg-[var(--surface-container-lowest)] text-[11px] font-bold text-[var(--on-surface)]">
                  {t.foodPrep}: {formatKHR(parseCurrency(existingCostForDate.food_price ?? existingCostForDate.foodPrice ?? 0))} |{' '}
                  {t.ingredientPantry}: {formatKHR(parseCurrency(existingCostForDate.ingredient_price ?? existingCostForDate.ingredientPrice ?? 0))}
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-[var(--on-surface-variant)] font-semibold">
                  {language === 'km' ? 'ទិន្នន័យថ្មីដែលត្រូវកត់ត្រា៖' : 'New Entry to Post:'}
                </span>
                <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">
                  {t.foodPrep}: {formatKHR(parseFloat(foodPrice) || 0)} |{' '}
                  {t.ingredientPantry}: {formatKHR(parseFloat(ingredientPrice) || 0)} ({t.total}: {formatKHR((parseFloat(foodPrice) || 0) + (parseFloat(ingredientPrice) || 0))})
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--on-surface-variant)] leading-relaxed">
              {language === 'km'
                ? `បានកត់ត្រាចំណាយសម្រាប់ ${expenseDate} រួចហើយ។ ការបញ្ជូននឹងបង្កើតកំណត់ត្រាចំណាយប្រចាំថ្ងៃមួយទៀតក្នុងមូលដ្ឋានទិន្នន័យ។ តើអ្នកពិតជាចង់បន្តមែនទេ?`
                : `A cost record already exists for ${expenseDate}. Submitting will create another daily cost record for this day in the database. Are you sure you want to proceed with this entry?`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDuplicateConfirm(false)}
                disabled={savingExpense}
                className="min-h-[48px] px-4 rounded-xl text-xs font-bold text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] transition-all"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={async () => {
                  const fPrice = parseFloat(foodPrice) || 0;
                  const iPrice = parseFloat(ingredientPrice) || 0;
                  setSavingExpense(true);
                  try {
                    await addDailyExpense(fPrice, iPrice, expenseDate);
                    setFoodPrice('');
                    setIngredientPrice('');
                    setExpenseDate(getLocalDateString(new Date()));
                    setShowDuplicateConfirm(false);
                  } catch {
                    // handled
                  } finally {
                    setSavingExpense(false);
                  }
                }}
                disabled={savingExpense}
                className="min-h-[48px] px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {savingExpense ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                )}
                <span>{language === 'km' ? 'យល់ព្រម និងកត់ត្រា' : 'Yes, Proceed & Post'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};