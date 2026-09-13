import React from 'react';
import { useNavigate } from 'react-router-dom';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'AWAY';
type MealStatus = 'EAT' | 'NOT_EAT' | null;
type ConfirmationType = 'AUTO' | 'MANUAL' | null;

interface MealAttendanceCardProps {
  userStatus?: UserStatus;
  currentMealStatus: MealStatus;
  confirmationType?: ConfirmationType;
  onToggleStatus: (status: 'EAT' | 'NOT_EAT') => void;
  mealLocked?: boolean;
  lockMessage?: string;
  loading?: boolean;
}

export const MealAttendanceCard: React.FC<MealAttendanceCardProps> = ({
  userStatus = 'INACTIVE',
  currentMealStatus,
  confirmationType = null,
  onToggleStatus,
  mealLocked = false,
  lockMessage = 'Meal selection is closed.',
  loading = false,
}) => {
  const navigate = useNavigate();

  const isActive = userStatus === 'ACTIVE';
  const isInactive = userStatus === 'INACTIVE';
  const isAway = userStatus === 'AWAY';

  const buttonsDisabled = loading || mealLocked || !isActive;

  return (
    <div className="p-5 rounded-3xl bg-[var(--surface-container-lowest)] border border-[var(--outline)]/10 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-[var(--on-surface)]">
          Tonight's Meal Attendance
        </h3>

        {confirmationType === 'AUTO' && isActive && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            ⚡ Auto-confirmed
          </span>
        )}

        {confirmationType === 'MANUAL' && isActive && (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            ✓ Recorded
          </span>
        )}
      </div>

      {/* Meal locked */}
      {mealLocked && (
        <div className="mb-4 p-3 rounded-xl bg-gray-100 border border-gray-200">
          <p className="text-sm font-medium text-gray-700">
            🔒 {lockMessage}
          </p>
        </div>
      )}

      {/* INACTIVE */}
      {isInactive && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-sm font-semibold text-amber-900">
            ⏳ Account pending admin approval.
          </p>

          <p className="text-xs text-amber-800 mt-1">
            You cannot select meals until an admin activates your account.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              disabled
              className="min-h-[48px] rounded-2xl bg-gray-200 text-gray-400 font-bold text-xs cursor-not-allowed"
            >
              EAT TONIGHT
            </button>

            <button
              type="button"
              disabled
              className="min-h-[48px] rounded-2xl bg-gray-200 text-gray-400 font-bold text-xs cursor-not-allowed"
            >
              SKIP MEAL
            </button>
          </div>
        </div>
      )}

      {/* AWAY */}
      {isAway && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <p className="text-sm font-semibold text-blue-900">
            ✈️ You're currently marked as Away.
          </p>

          <p className="text-xs text-blue-800 mt-1">
            Switch back to Active in your Profile to resume meal attendance.
          </p>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="grid grid-cols-2 gap-3 flex-1">
              <button
                type="button"
                disabled
                className="min-h-[48px] rounded-2xl bg-gray-200 text-gray-400 font-bold text-xs cursor-not-allowed"
              >
                EAT TONIGHT
              </button>

              <button
                type="button"
                disabled
                className="min-h-[48px] rounded-2xl bg-gray-200 text-gray-400 font-bold text-xs cursor-not-allowed"
              >
                SKIP MEAL
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mt-3 text-xs font-bold text-blue-700 underline"
          >
            Go to Profile →
          </button>
        </div>
      )}

      {/* ACTIVE */}
      {isActive && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => onToggleStatus('EAT')}
            className={`min-h-[48px] rounded-2xl font-bold text-xs transition-all ${buttonsDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : currentMealStatus === 'EAT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {loading ? 'Saving...' : 'EAT TONIGHT'}
          </button>

          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => onToggleStatus('NOT_EAT')}
            className={`min-h-[48px] rounded-2xl font-bold text-xs transition-all ${buttonsDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : currentMealStatus === 'NOT_EAT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {loading ? 'Saving...' : 'SKIP MEAL'}
          </button>
        </div>
      )}
    </div>
  );
};