import React, { useState } from 'react';
import { ApiUser, MealStatusRecord, DailyCostRecord } from '../api/types';

interface MealsScreenProps {
  currentUser: ApiUser | null;
  mealStatuses: MealStatusRecord[];
  dailyCosts: DailyCostRecord[];
  members: ApiUser[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleMealStatus: (status: 'EAT' | 'NOT_EAT', dateStr?: string) => Promise<void>;
  onOpenAuth: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const MealsScreen: React.FC<MealsScreenProps> = ({
  currentUser,
  mealStatuses,
  dailyCosts,
  members,
  isLoading,
  error,
  onRetry,
  onToggleMealStatus,
  onOpenAuth,
  onShowToast,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'EAT' | 'NOT_EAT'>('ALL');

  // Find status for selected date
  const selectedDateRecord = mealStatuses.find((m) => {
    const d = m.date ? m.date.split('T')[0] : '';
    return d === selectedDate;
  });

  const handleStatusChange = async (status: 'EAT' | 'NOT_EAT') => {
    if (!currentUser) {
      onShowToast('Please sign in to log meal status', 'login');
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    try {
      await onToggleMealStatus(status, selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const fmtCurrency = (val?: string | number | null) => {
    if (!val) return '$0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Filtered records
  const filteredRecords = mealStatuses.filter((record) => {
    if (filterType === 'ALL') return true;
    return record.status === filterType;
  });

  // Find matching daily cost for selected date if exists
  const costForSelectedDate = dailyCosts.find((c) => {
    const d = c.date ? c.date.split('T')[0] : '';
    return d === selectedDate;
  });

  return (
    <div className="flex flex-col w-full px-screen-gutter pb-8 gap-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            Meal Attendance
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Live attendance records & daily cut-offs
          </p>
        </div>

        {!currentUser && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all"
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
            Fetching meal records from API...
          </span>
        </div>
      )}

      {/* Error State Banner with Retry */}
      {error && (
        <div className="p-4 rounded-2xl bg-error-container/20 border border-error/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span className="font-label-md text-label-md font-bold">Failed to load meal statuses</span>
          </div>
          <p className="font-body-sm text-xs text-on-surface-variant">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="self-start mt-1 px-3.5 py-1.5 rounded-xl bg-error text-on-error font-label-sm text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Date Picker & Selection */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm p-4 gap-3 border border-surface-container-high/40">
        <div className="flex items-center justify-between">
          <label className="font-label-md text-sm font-semibold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
            <span>Select Meal Date</span>
          </label>

          {selectedDate === todayStr && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-[10px] font-bold">
              TODAY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="h-11 px-3.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors"
          >
            Today
          </button>
        </div>

        {/* Selected Date Card & Actions: POST /meal-statuses */}
        <div className="mt-2 p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-title-md text-sm font-bold text-on-surface">
                {fmtDate(selectedDate)}
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant">
                {selectedDateRecord
                  ? `Recorded: ${selectedDateRecord.status}`
                  : 'No attendance choice logged yet'}
              </span>
            </div>

            {selectedDateRecord && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  selectedDateRecord.status === 'EAT'
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-stone-500/15 text-stone-600'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {selectedDateRecord.status === 'EAT' ? 'check_circle' : 'cancel'}
                </span>
                <span>{selectedDateRecord.status}</span>
              </span>
            )}
          </div>

          {/* Daily cost details if logged */}
          {costForSelectedDate && (
            <div className="p-2.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface flex items-center justify-between">
              <span>Day's Pool Cost:</span>
              <span className="font-bold">
                Food {fmtCurrency(costForSelectedDate.foodPrice ?? costForSelectedDate.food_price)} +
                Pantry {fmtCurrency(costForSelectedDate.ingredientPrice ?? costForSelectedDate.ingredient_price)}
              </span>
            </div>
          )}

          {/* Action buttons calling POST /meal-statuses */}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleStatusChange('EAT')}
              className={`flex-1 h-11 rounded-xl font-label-md text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                selectedDateRecord?.status === 'EAT'
                  ? 'bg-primary text-on-primary ring-2 ring-primary ring-offset-1'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              } ${isSubmitting ? 'opacity-50' : 'active:scale-98'}`}
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>EAT TONIGHT</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleStatusChange('NOT_EAT')}
              className={`flex-1 h-11 rounded-xl font-label-md text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                selectedDateRecord?.status === 'NOT_EAT'
                  ? 'bg-secondary text-on-secondary ring-2 ring-secondary ring-offset-1'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              } ${isSubmitting ? 'opacity-50' : 'active:scale-98'}`}
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>SKIP MEAL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Meal Attendance Records History: GET /meal-statuses */}
      <div className="flex flex-col rounded-2xl bg-surface-container-lowest shadow-sm p-4 gap-3 border border-surface-container-high/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface font-bold">
              Attendance Records
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant">
              {mealStatuses.length} records returned by GET /meal-statuses
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex bg-surface-container-low p-1 rounded-xl gap-1">
            {(['ALL', 'EAT', 'NOT_EAT'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterType === t
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'EAT' ? 'Eaten' : 'Skipped'}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 && !isLoading && (
          <div className="py-8 text-center text-xs text-on-surface-variant flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[28px] opacity-40">restaurant</span>
            <span>No meal attendance records found.</span>
            <span className="opacity-75">Use the buttons above to log meal attendance.</span>
          </div>
        )}

        <div className="flex flex-col divide-y divide-surface-container-high/40">
          {filteredRecords.map((record) => {
            const isEat = record.status === 'EAT';
            // Match member if member_id exists
            const memberMatch = members.find(
              (m) => String(m.id) === String(record.member_id || record.memberId)
            );

            return (
              <div key={record.id || `${record.date}-${record.status}`} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isEat ? 'bg-emerald-500/15 text-emerald-600' : 'bg-stone-500/15 text-stone-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isEat ? 'restaurant' : 'fastfood'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-md text-sm font-semibold text-on-surface">
                        {fmtDate(record.date)}
                      </span>
                      {record.confirmation_type && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant uppercase font-medium">
                          {record.confirmation_type}
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-xs text-on-surface-variant block truncate">
                      {memberMatch ? `${memberMatch.name} (@${memberMatch.username})` : 'User ID: ' + (record.member_id || record.memberId || 'Me')}
                      {record.confirmed_at && ` • ${new Date(record.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span
                    className={`font-label-sm text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isEat
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-stone-500/15 text-stone-600'
                    }`}
                  >
                    {record.status}
                  </span>

                  {record.cost_total && (
                    <span className="font-title-md text-xs font-semibold text-on-surface mt-0.5">
                      {fmtCurrency(record.cost_total)}
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
