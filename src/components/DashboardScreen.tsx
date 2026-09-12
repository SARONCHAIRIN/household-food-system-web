import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, parseCurrency } from '../services/apiClient';
import { getLocalDateString } from '../services/billingDateUtils';

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

  // Meal attendance count for today
  const todayEaters = mealStatuses.filter(
    (m) => m.date.startsWith(todayStr) && m.status === 'EAT'
  ).length;

  // Today's logged cost (if any) from GET /daily-costs
  const todayCost = dailyCosts.find((c) => c.date.startsWith(todayStr));

  // Compute live pool sums strictly from GET /daily-costs
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
  // Default date picker to today's real local device date
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [foodPrice, setFoodPrice] = useState('');
  const [ingredientPrice, setIngredientPrice] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

  // Check if a record already exists for the actively selected date in GET /daily-costs
  const existingCostForDate = dailyCosts.find(
    (c) => c.date && c.date.split('T')[0] === expenseDate
  );

  const handleDinnerSelection = async (status: 'EAT' | 'NOT_EAT') => {
    try {
      await toggleMealStatus(todayStr, status);
    } catch {
      // handled
    }
  };

  const handleSaveExpense = async () => {
    const fPrice = parseFloat(foodPrice) || 0;
    const iPrice = parseFloat(ingredientPrice) || 0;
    if (fPrice <= 0 && iPrice <= 0) {
      showToast(language === 'km' ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់សម្រាប់ម្ហូប ឬគ្រឿងទេស' : 'Please enter an amount for food or ingredients', 'error');
      return;
    }

    if (!expenseDate) {
      showToast(language === 'km' ? 'សូមជ្រើសរើសកាលបរិច្ឆេទត្រឹមត្រូវ' : 'Please select a valid date', 'error');
      return;
    }

    // If duplicate exists and user hasn't explicitly confirmed, show confirmation modal
    if (existingCostForDate && !showDuplicateConfirm) {
      setShowDuplicateConfirm(true);
      return;
    }

    setSavingExpense(true);
    try {
      // Send exact date selected in the picker (YYYY-MM-DD)
      await addDailyExpense(fPrice, iPrice, expenseDate);
      setFoodPrice('');
      setIngredientPrice('');
      // Reset date picker back to today's real date
      setExpenseDate(getLocalDateString(new Date()));
      setShowDuplicateConfirm(false);
    } catch {
      // handled
    } finally {
      setSavingExpense(false);
    }
  };

  // Active household counts from real members
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

      {/* Responsive Top Grid: Live Food Pool & Tonight's Dinner (Side-by-side on tablet/desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Primary Live Food Pool Card */}
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
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {formatCurrency(totalPool)}
                </span>
                <span className="text-xs font-bold text-[#9ff4ca]">{t.usdDue}</span>
              </div>
              <p className="text-xs text-[#9ff4ca]/80 mt-1">
                {t.aggregatedFromApi}
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
                    {formatCurrency(totalFoodPrep)}
                  </div>
                  <div className="text-[11px] text-[#9ff4ca]/80 mt-0.5">
                    {foodSharePct}% {t.percentOfPool}
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
                    {formatCurrency(totalPantry)}
                  </div>
                  <div className="text-[11px] text-[#ffdbca]/80 mt-0.5">
                    {pantrySharePct}% {t.percentOfPool}
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
                    ? `${t.costLogged}: ${t.foodPrep} $${parseCurrency(todayCost.food_price ?? todayCost.foodPrice ?? 0).toFixed(2)} | ${t.ingredientPantry} $${parseCurrency(todayCost.ingredient_price ?? todayCost.ingredientPrice ?? 0).toFixed(2)}`
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

            {/* Attendance Action Buttons (min 48px touch target) */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => handleDinnerSelection('EAT')}
                className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isEating === true
                    ? 'bg-[var(--primary)] text-white shadow-md ring-2 ring-[var(--primary)]'
                    : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span>{t.eatTonight}</span>
                  <span className="text-[10px] opacity-80">{t.eatTonightKh}</span>
                </div>
              </button>

              <button
                onClick={() => handleDinnerSelection('NOT_EAT')}
                className={`min-h-[48px] px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  isEating === false
                    ? 'bg-[var(--secondary)] text-white shadow-md ring-2 ring-[var(--secondary)]'
                    : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span>{t.skipMeal}</span>
                  <span className="text-[10px] opacity-80">{t.skipMealKh}</span>
                </div>
              </button>
            </div>
          </div>

          <div className="text-xs text-[var(--on-surface-variant)] text-center py-1 bg-[var(--surface-container-low)] rounded-xl">
            {isEating === true && (language === 'km' ? '✅ វត្តមានរបស់អ្នកត្រូវបានកត់ត្រា៖ ញ៉ាំ' : '✅ Your attendance is recorded: EAT')}
            {isEating === false && (language === 'km' ? '❌ វត្តមានរបស់អ្នកត្រូវបានកត់ត្រា៖ មិនញ៉ាំ' : '❌ Your attendance is recorded: NOT_EAT')}
            {isEating === null && (language === 'km' ? '⏳ មិនទាន់មានការឆ្លើយតបសម្រាប់ថ្ងៃនេះនៅឡើយទេ' : '⏳ No response submitted for today yet.')}
          </div>
        </div>
      </div>

      {/* Household Members List (2-column responsive grid on tablet & desktop) */}
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
          /* Multi-column 2-column grid for tablet & desktop */
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

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        m.status === 'ACTIVE'
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

      {/* Recent Daily Costs (Multi-column responsive grid on tablet & desktop) */}
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
                        {t.foodPrep} ${fPrice.toFixed(2)} | {t.ingredientPantry} ${iPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-extrabold text-[var(--on-surface)]">
                      {formatCurrency(total)}
                    </span>
                    <span className="block text-[10px] font-bold text-[var(--primary)]">
                      {t.costLogged}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POST /daily-costs Form (Admin only) */}
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
                  {language === 'km' ? 'កត់ត្រាចំណាយប្រចាំថ្ងៃ (អ្នកគ្រប់គ្រង)' : 'Record Daily Cost (Admin)'}
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

          {/* Explicit Date Picker Field directly below the title */}
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

          {/* Duplicate Cost Warning Banner if record already exists for selected date */}
          {existingCostForDate && (
            <div className="p-3.5 rounded-2xl bg-[var(--error-container)]/30 border border-[var(--error)]/30 text-[var(--error)] text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>{language === 'km' ? 'ការព្រមាន៖ កំណត់ត្រាត្រួតគ្នា' : 'Duplicate Record Warning'}</span>
              </div>
              <p className="leading-relaxed">
                {language === 'km'
                  ? `បានកត់ត្រាចំណាយសម្រាប់ ${expenseDate} រួចហើយ៖ ម្ហូប $${parseCurrency(existingCostForDate.food_price ?? existingCostForDate.foodPrice ?? 0).toFixed(2)} / គ្រឿងទេស $${parseCurrency(existingCostForDate.ingredient_price ?? existingCostForDate.ingredientPrice ?? 0).toFixed(2)}។`
                  : `A cost record already exists for ${expenseDate}: Food $${parseCurrency(existingCostForDate.food_price ?? existingCostForDate.foodPrice ?? 0).toFixed(2)} / Ingredient $${parseCurrency(existingCostForDate.ingredient_price ?? existingCostForDate.ingredientPrice ?? 0).toFixed(2)}.`}
              </p>
              <p className="text-[11px] opacity-90">
                {language === 'km' ? 'ការរក្សាទុកទាមទារការបញ្ជាក់ច្បាស់លាស់ដើម្បីជៀសវាងការត្រួតគ្នាដោយអចេតនា។' : 'Saving will require explicit confirmation to avoid accidental duplicates.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--on-surface-variant)]">
                {t.foodPrep} ($)
              </label>
              <input
                type="number"
                step="0.5"
                value={foodPrice}
                onChange={(e) => setFoodPrice(e.target.value)}
                placeholder="10.00"
                className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container-lowest)] text-[var(--on-surface)] font-bold text-sm outline-none shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--on-surface-variant)]">
                {t.ingredientPantry} ($)
              </label>
              <input
                type="number"
                step="0.5"
                value={ingredientPrice}
                onChange={(e) => setIngredientPrice(e.target.value)}
                placeholder="5.00"
                className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container-lowest)] text-[var(--on-surface)] font-bold text-sm outline-none shadow-xs"
              />
            </div>
          </div>

          <button
            onClick={handleSaveExpense}
            disabled={savingExpense || !expenseDate}
            className={`w-full min-h-[48px] rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50 ${
              existingCostForDate
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
                ? (language === 'km' ? `ពិនិត្យទិន្នន័យត្រួតគ្នា (${expenseDate})` : `Review Duplicate for ${expenseDate}`)
                : (language === 'km' ? `រក្សាទុកចំណាយសម្រាប់ ${expenseDate}` : `Save Cost for ${expenseDate}`)}
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
                  {t.foodPrep}: ${parseCurrency(existingCostForDate.food_price ?? existingCostForDate.foodPrice ?? 0).toFixed(2)} |{' '}
                  {t.ingredientPantry}: ${parseCurrency(existingCostForDate.ingredient_price ?? existingCostForDate.ingredientPrice ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-[var(--on-surface-variant)] font-semibold">
                  {language === 'km' ? 'ទិន្នន័យថ្មីដែលត្រូវកត់ត្រា៖' : 'New Entry to Post:'}
                </span>
                <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[11px] font-bold text-[var(--primary)]">
                  {t.foodPrep}: ${(parseFloat(foodPrice) || 0).toFixed(2)} |{' '}
                  {t.ingredientPantry}: ${(parseFloat(ingredientPrice) || 0).toFixed(2)} ({t.total}: ${((parseFloat(foodPrice) || 0) + (parseFloat(ingredientPrice) || 0)).toFixed(2)})
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
