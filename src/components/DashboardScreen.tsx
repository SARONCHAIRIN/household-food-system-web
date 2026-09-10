import React, { useState } from 'react';
import { ApiUser, DailyCostRecord, MealStatusRecord, BillsSummaryResponse } from '../api/types';
import { NavTab } from '../types';
import { getBaseUrl, setCustomBaseUrl, LIVE_API_URL, LOCAL_API_URL } from '../api/client';

interface DashboardScreenProps {
  currentUser: ApiUser | null;
  members: ApiUser[];
  dailyCosts: DailyCostRecord[];
  mealStatuses: MealStatusRecord[];
  billsSummary?: BillsSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleMealStatus: (status: 'EAT' | 'NOT_EAT') => Promise<void>;
  onToggleMemberStatus: (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  onOpenAddExpense: () => void;
  onOpenManageMembers: () => void;
  onOpenAuth: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onShowToast: (msg: string, icon?: string) => void;
  onOpenApiSettings?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentUser,
  members,
  dailyCosts,
  mealStatuses,
  billsSummary,
  isLoading,
  error,
  onRetry,
  onToggleMealStatus,
  onToggleMemberStatus,
  onOpenAddExpense,
  onOpenManageMembers,
  onOpenAuth,
  onNavigateTab,
  onShowToast,
}) => {
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const isAdmin = currentUser?.role === 'ADMIN';

  // Find today's meal status for current user if available
  const todayRecord = mealStatuses.find((m) => {
    const recordDate = m.date ? m.date.split('T')[0] : '';
    return recordDate === todayStr;
  });
  const currentAttendanceStatus = todayRecord?.status;

  const handleAttendanceClick = async (status: 'EAT' | 'NOT_EAT') => {
    if (!currentUser) {
      onShowToast('Please sign in to update your meal attendance', 'login');
      onOpenAuth();
      return;
    }
    setIsUpdatingAttendance(true);
    try {
      await onToggleMealStatus(status);
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  const handleMemberStatusToggle = async (m: ApiUser) => {
    if (!isAdmin) {
      onShowToast('Only administrators can update member status', 'shield');
      return;
    }
    const newStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdatingMemberId(m.id);
    try {
      await onToggleMemberStatus(m.id, newStatus);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  // Format currency helper
  const fmtCurrency = (val?: string | number | null) => {
    if (val === undefined || val === null) return '$0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Format date helper
  const fmtDate = (dStr?: string) => {
    if (!dStr) return '';
    try {
      const clean = dStr.split('T')[0];
      const [y, m, d] = clean.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  // Total daily costs aggregated
  const totalFoodCost = dailyCosts.reduce((acc, c) => {
    const val = parseFloat(String(c.foodPrice ?? c.food_price ?? 0));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalIngredientCost = dailyCosts.reduce((acc, c) => {
    const val = parseFloat(String(c.ingredientPrice ?? c.ingredient_price ?? 0));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const totalPoolAggregate = totalFoodCost + totalIngredientCost;

  // Active members count
  const activeMembers = members.filter((m) => m.status === 'ACTIVE');

  return (
    <div className="flex flex-col w-full px-screen-gutter pb-8 gap-y-4 max-w-lg mx-auto">
      {/* Top Greeting & Role Badge */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              {currentUser ? `Hello, ${currentUser.name.split(' ')[0]}` : 'Household Food'}
            </h1>
            <span className="text-xl animate-bounce">👋</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {currentUser ? `@${currentUser.username} • ${currentUser.role}` : 'Shared household meal system'}
          </p>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container shadow-xs shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                currentUser.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {currentUser.status}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Loading State Banner */}
      {isLoading && (
        <div className="p-4 rounded-2xl bg-surface-container border border-surface-container-high/60 flex items-center justify-center gap-3 animate-pulse">
          <span className="material-symbols-outlined text-primary text-[22px] animate-spin">sync</span>
          <span className="font-label-md text-label-md text-on-surface font-medium">
            Fetching latest data from API...
          </span>
        </div>
      )}

      {/* Error State Banner with Retry & Server Switch */}
      {error && (
        <div className="p-4 rounded-2xl bg-error-container/20 border border-error/20 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-error">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-label-md text-label-md font-bold">Failed to load data</span>
            </div>
            <span className="text-[11px] font-mono text-on-surface-variant truncate max-w-[170px]" title={getBaseUrl()}>
              {getBaseUrl()}
            </span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant">{error}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-1.5 rounded-xl bg-error text-on-error font-label-sm text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              <span>Retry Connection</span>
            </button>
            {getBaseUrl() !== LIVE_API_URL && (
              <button
                type="button"
                onClick={() => {
                  setCustomBaseUrl(LIVE_API_URL);
                  onShowToast('Switched to Cloud API (Render)', 'cloud');
                  onRetry();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-primary/40 bg-primary/10 text-primary font-label-sm text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">cloud</span>
                <span>Switch to Cloud API (Render)</span>
              </button>
            )}
            {getBaseUrl() !== LOCAL_API_URL && (
              <button
                type="button"
                onClick={() => {
                  setCustomBaseUrl(LOCAL_API_URL);
                  onShowToast('Switched to Localhost (10000)', 'laptop');
                  onRetry();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface text-on-surface font-label-sm text-xs font-bold hover:bg-surface-container transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">laptop</span>
                <span>Switch to Local (10000)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attendance Action Card: POST /meal-statuses */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm p-4 gap-3.5 border border-surface-container-high/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">dinner_dining</span>
            </div>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">
                Dinner Attendance
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Today • {fmtDate(todayStr)}
              </p>
            </div>
          </div>

          {currentAttendanceStatus ? (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                currentAttendanceStatus === 'EAT'
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : 'bg-stone-500/15 text-stone-600'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {currentAttendanceStatus === 'EAT' ? 'check_circle' : 'cancel'}
              </span>
              <span>{currentAttendanceStatus === 'EAT' ? 'EATING' : 'SKIPPING'}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 text-xs font-semibold">
              Pending choice
            </span>
          )}
        </div>

        {/* Action buttons calling POST /meal-statuses */}
        <div className="flex p-1 rounded-2xl bg-surface-container-low gap-1.5">
          <button
            type="button"
            disabled={isUpdatingAttendance}
            onClick={() => handleAttendanceClick('EAT')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all font-label-md text-label-md ${
              currentAttendanceStatus === 'EAT'
                ? 'bg-primary text-on-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface font-medium hover:bg-surface-container'
            } ${isUpdatingAttendance ? 'opacity-50 cursor-not-allowed' : 'active:scale-98'}`}
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>EAT TONIGHT</span>
          </button>

          <button
            type="button"
            disabled={isUpdatingAttendance}
            onClick={() => handleAttendanceClick('NOT_EAT')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all font-label-md text-label-md ${
              currentAttendanceStatus === 'NOT_EAT'
                ? 'bg-secondary-container text-on-secondary-container shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface font-medium hover:bg-surface-container'
            } ${isUpdatingAttendance ? 'opacity-50 cursor-not-allowed' : 'active:scale-98'}`}
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            <span>SKIP MEAL</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container-high/30">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">groups</span>
            <span>{activeMembers.length} active household members</span>
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('meals')}
            className="text-primary font-bold hover:underline flex items-center gap-0.5"
          >
            <span>View All Attendance</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Real Pool & Expense Summary */}
      <div className="relative overflow-hidden rounded-2xl bg-primary text-on-primary shadow-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="font-label-sm text-xs tracking-wider uppercase opacity-85 font-semibold">
              Live Food Pool Total
            </span>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold shadow-xs hover:opacity-95 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Add Expense</span>
            </button>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight">
            {billsSummary?.poolSummary
              ? fmtCurrency(
                  Number(billsSummary.poolSummary.totalFoodPrice || 0) +
                    Number(billsSummary.poolSummary.totalIngredientPrice || 0)
                )
              : fmtCurrency(totalPoolAggregate)}
          </span>
          <span className="text-xs opacity-75 ml-1.5">
            {billsSummary?.period
              ? `${billsSummary.period.startDate} to ${billsSummary.period.endDate}`
              : 'Aggregated from Daily Costs'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
          <div className="flex flex-col">
            <span className="opacity-75">Food Prep Total</span>
            <span className="font-bold text-sm">
              {billsSummary?.poolSummary
                ? fmtCurrency(billsSummary.poolSummary.totalFoodPrice)
                : fmtCurrency(totalFoodCost)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="opacity-75">Ingredient / Pantry</span>
            <span className="font-bold text-sm">
              {billsSummary?.poolSummary
                ? fmtCurrency(billsSummary.poolSummary.totalIngredientPrice)
                : fmtCurrency(totalIngredientCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Household Members List: GET /members */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm p-4 gap-3 border border-surface-container-high/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">
                Household Members
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {members.length} registered ({activeMembers.length} active)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenManageMembers}
            className="text-primary font-label-md text-xs font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Manage</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {members.length === 0 && !isLoading && (
          <div className="py-6 text-center text-xs text-on-surface-variant">
            No household members found.
          </div>
        )}

        <div className="flex flex-col divide-y divide-surface-container-high/40">
          {members.map((m) => {
            const isActive = m.status === 'ACTIVE';
            const isSelf = currentUser && String(currentUser.id) === String(m.id);
            const isUpdating = updatingMemberId === m.id;

            return (
              <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {(m.name || m.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-label-md text-sm font-semibold text-on-surface truncate">
                        {m.name || m.username}
                      </span>
                      {isSelf && (
                        <span className="font-label-sm text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                          YOU
                        </span>
                      )}
                      <span className="font-label-sm text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-medium">
                        {m.role}
                      </span>
                    </div>
                    <span className="font-body-sm text-xs text-on-surface-variant truncate block">
                      @{m.username} • {m.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-label-sm text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-stone-500/15 text-stone-600'
                    }`}
                  >
                    {m.status}
                  </span>

                  {isAdmin && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleMemberStatusToggle(m)}
                      title={`Toggle status (currently ${m.status})`}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                          : 'bg-primary text-on-primary hover:opacity-90'
                      } ${isUpdating ? 'opacity-50' : 'active:scale-95'}`}
                    >
                      {isUpdating ? '...' : isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Daily Costs List: GET /daily-costs */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm p-4 gap-3 border border-surface-container-high/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">receipt</span>
            </div>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">
                Recent Daily Costs
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {dailyCosts.length} records logged
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="text-primary font-label-md text-xs font-bold hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Cost</span>
            </button>
          )}
        </div>

        {dailyCosts.length === 0 && !isLoading && (
          <div className="py-6 text-center text-xs text-on-surface-variant">
            No daily costs recorded yet. {isAdmin && "Tap 'Add Cost' to record today's food price."}
          </div>
        )}

        <div className="flex flex-col divide-y divide-surface-container-high/40">
          {dailyCosts.slice(0, 5).map((cost) => {
            const food = parseFloat(String(cost.foodPrice ?? cost.food_price ?? 0));
            const ingr = parseFloat(String(cost.ingredientPrice ?? cost.ingredient_price ?? 0));
            const total = food + ingr;
            const diners = cost.eatCount ?? cost.eat_count;

            return (
              <div key={cost.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-sm font-semibold text-on-surface">
                      {fmtDate(cost.date)}
                    </span>
                    {diners !== undefined && diners !== null && (
                      <span className="font-label-sm text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant">
                        {diners} diners
                      </span>
                    )}
                  </div>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    Food: {fmtCurrency(food)} • Pantry: {fmtCurrency(ingr)}
                  </span>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="font-title-md text-sm font-bold text-on-surface">
                    {fmtCurrency(total)}
                  </span>
                  {(cost.cost_food_per_person || cost.cost_ingredient_per_person) && (
                    <span className="text-[10px] text-on-surface-variant">
                      {fmtCurrency(
                        parseFloat(String(cost.cost_food_per_person || 0)) +
                          parseFloat(String(cost.cost_ingredient_per_person || 0))
                      )}
                      /person
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
