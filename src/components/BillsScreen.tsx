import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import {
  ApiUser,
  BillsSummaryResponse,
  LastSettlementResponse,
  SettlementsListResponse,
  SettleBillsResponse,
} from '../api/types';

interface BillsScreenProps {
  currentUser: ApiUser | null;
  onOpenAuth: () => void;
  onShowToast: (msg: string, icon?: string) => void;
  onNavigateToDeposits?: () => void;
}

type BillsTab = 'last-settlement' | 'summary' | 'settle' | 'history';

export const BillsScreen: React.FC<BillsScreenProps> = ({
  currentUser,
  onOpenAuth,
  onShowToast,
  onNavigateToDeposits,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<BillsTab>('last-settlement');

  // Format currency helper strictly to 2 decimal places
  const fmtCurrency = (val?: string | number | null) => {
    if (val === undefined || val === null) return '$0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Date range state for Summary & Settle
  const getInitialDates = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const startOfMonth = `${y}-${m}-01`;
    const today = `${y}-${m}-${d}`;
    return { startOfMonth, today };
  };

  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState<string>(initialDates.startOfMonth);
  const [endDate, setEndDate] = useState<string>(initialDates.today);

  // Quick Preset Helper
  const applyDatePreset = (preset: 'this-month' | 'last-month' | 'last-14-days' | 'last-7-days') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === 'this-month') {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (preset === 'last-month') {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (preset === 'last-14-days') {
      const start = new Date();
      start.setDate(now.getDate() - 14);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'last-7-days') {
      const start = new Date();
      start.setDate(now.getDate() - 7);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // 1. Last Settlement State
  const [lastSettlement, setLastSettlement] = useState<LastSettlementResponse | null>(null);
  const [isLoadingLast, setIsLoadingLast] = useState<boolean>(true);
  const [errorLast, setErrorLast] = useState<string | null>(null);

  const fetchLastSettlement = useCallback(async () => {
    if (!currentUser) {
      setIsLoadingLast(false);
      return;
    }
    setIsLoadingLast(true);
    setErrorLast(null);
    try {
      const res = await api.bills.getLastSettlement();
      setLastSettlement(res);
    } catch (err: any) {
      console.warn('Failed to fetch last settlement:', err);
      setErrorLast(err.message || 'Failed to load the last settlement record.');
    } finally {
      setIsLoadingLast(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLastSettlement();
  }, [fetchLastSettlement]);

  // 2. Summary / Preview State (GET /bills/summary)
  const [summaryData, setSummaryData] = useState<BillsSummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);

  const handleCalculateSummary = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!startDate || !endDate) {
      onShowToast('Please select both start and end dates', 'error');
      return;
    }
    if (startDate > endDate) {
      onShowToast('Start date cannot be after end date', 'error');
      return;
    }

    setIsLoadingSummary(true);
    setErrorSummary(null);
    try {
      const res = await api.bills.getSummary({ startDate, endDate });
      setSummaryData(res);
      onShowToast('Bill preview calculation updated', 'check_circle');
    } catch (err: any) {
      console.error('Failed to calculate summary:', err);
      setErrorSummary(err.message || 'Failed to calculate bill summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // 3. Settle Action State (POST /bills/settle)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [settleResults, setSettleResults] = useState<SettleBillsResponse | null>(null);

  const handleExecuteSettle = async () => {
    if (!isAdmin) {
      onShowToast('Only administrators can settle bills.', 'error');
      return;
    }
    if (!startDate || !endDate) {
      onShowToast('Please select valid settlement dates.', 'error');
      return;
    }

    setIsSettling(true);
    try {
      const res = await api.bills.settle({ startDate, endDate });
      setSettleResults(res);
      setIsConfirmModalOpen(false);
      onShowToast(res.message || 'Cycle settlement executed successfully!', 'check_circle');

      // Refresh last settlement and history
      fetchLastSettlement();
      fetchSettlementsHistory(0);
    } catch (err: any) {
      console.error('Settlement execution failed:', err);
      onShowToast(err.message || 'Settlement failed. Please try again.', 'error');
    } finally {
      setIsSettling(false);
    }
  };

  // 4. Settlement History State (GET /bills/settlements?limit=10&offset=0)
  const [historyData, setHistoryData] = useState<SettlementsListResponse | null>(null);
  const [historyOffset, setHistoryOffset] = useState<number>(0);
  const historyLimit = 10;
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  const fetchSettlementsHistory = useCallback(async (offset: number) => {
    if (!currentUser) return;
    setIsLoadingHistory(true);
    setErrorHistory(null);
    try {
      const res = await api.bills.getSettlements({ limit: historyLimit, offset });
      setHistoryData(res);
      setHistoryOffset(offset);
    } catch (err: any) {
      console.warn('Failed to fetch settlements history:', err);
      setErrorHistory(err.message || 'Failed to load settlements history.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentUser]);

  // Load history when tab is clicked
  useEffect(() => {
    if (activeTab === 'history' && !historyData && !isLoadingHistory) {
      fetchSettlementsHistory(0);
    }
  }, [activeTab, historyData, isLoadingHistory, fetchSettlementsHistory]);

  // Helper to render settlement status badge
  const renderSettlementStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('SUCCESS') || s === 'SETTLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-[11px]">
          <span className="material-symbols-outlined text-[13px]">check_circle</span>
          {status.replace(/_/g, ' ')}
        </span>
      );
    }
    if (s.includes('INSUFFICIENT') || s.includes('DEBT') || s.includes('PARTIAL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 font-bold text-[11px]">
          <span className="material-symbols-outlined text-[13px]">warning</span>
          {status.replace(/_/g, ' ')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-bold text-[11px]">
        <span className="material-symbols-outlined text-[13px]">info</span>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  // Auth gate
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-container/40 flex items-center justify-center text-primary mb-4">
          <span className="material-symbols-outlined text-4xl">receipt_long</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Household Bills & Settlements</h2>
        <p className="text-sm text-on-surface-variant max-w-sm mb-6">
          Sign in to preview meal billing cycles, inspect previous settlements, or execute deposit deductions.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">receipt_long</span>
            Bills & Settlements
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Preview pro-rata meal billing cycles, execute fund deductions, and review history.
          </p>
        </div>

        {onNavigateToDeposits && (
          <button
            type="button"
            onClick={onNavigateToDeposits}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            View Deposits
          </button>
        )}
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('last-settlement')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'last-settlement'
              ? 'bg-surface-container-lowest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">event_available</span>
          <span>Last Settlement</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('summary');
            if (!summaryData && !isLoadingSummary) {
              handleCalculateSummary();
            }
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'summary'
              ? 'bg-surface-container-lowest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">calculate</span>
          <span>Summary & Preview</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('settle')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'settle'
                ? 'bg-surface-container-lowest text-rose-600 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">paid</span>
            <span>Settle & Deduct</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-surface-container-lowest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">history</span>
          <span>Settlement History</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. LAST SETTLEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'last-settlement' && (
        <div className="space-y-6">
          {isLoadingLast && (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3"></div>
              <span className="text-sm font-semibold text-on-surface-variant">Loading last settlement record...</span>
            </div>
          )}

          {!isLoadingLast && errorLast && (
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px]">error</span>
              </div>
              <p className="text-sm font-bold text-on-surface mb-1">Could Not Load Last Settlement</p>
              <p className="text-xs text-on-surface-variant max-w-sm mb-4">{errorLast}</p>
              <button
                type="button"
                onClick={fetchLastSettlement}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoadingLast && !errorLast && !lastSettlement && (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px]">receipt_long</span>
              </div>
              <p className="text-base font-bold text-on-surface mb-1">No Past Settlement Recorded</p>
              <p className="text-xs text-on-surface-variant max-w-md mb-5">
                No billing cycles have been settled yet. Administrators can run calculations and deductions using the "Settle & Deduct" tab.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settle')}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
                >
                  Create First Settlement
                </button>
              )}
            </div>
          )}

          {!isLoadingLast && !errorLast && lastSettlement && (
            <div className="space-y-6">
              {/* Last Settlement Hero Card */}
              <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant/60 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-container-high">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs mb-2">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      Most Recent Completed Settlement
                    </div>
                    <h2 className="text-xl font-bold text-on-surface">
                      Cycle: {lastSettlement.start_date || lastSettlement.startDate || '—'} to{' '}
                      {lastSettlement.end_date || lastSettlement.endDate || '—'}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Settled by{' '}
                      <span className="font-semibold text-on-surface">
                        {lastSettlement.settled_by_name || lastSettlement.settledByName || 'Administrator'}
                      </span>{' '}
                      on{' '}
                      {lastSettlement.created_at || lastSettlement.createdAt
                        ? new Date(lastSettlement.created_at || lastSettlement.createdAt!).toLocaleString()
                        : '—'}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-on-surface-variant block uppercase tracking-wider">
                      Total Cycle Pool Settled
                    </span>
                    <span className="text-3xl font-extrabold text-primary">
                      {fmtCurrency(lastSettlement.total_due_all || lastSettlement.totalDueAll)}
                    </span>
                  </div>
                </div>

                {/* Pool Breakdown Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-5">
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40">
                    <span className="text-xs text-on-surface-variant font-medium block">Total Food Cost</span>
                    <span className="text-lg font-bold text-on-surface mt-1 block">
                      {fmtCurrency(lastSettlement.total_food_cost || lastSettlement.totalFoodCost)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40">
                    <span className="text-xs text-on-surface-variant font-medium block">Total Ingredient Cost</span>
                    <span className="text-lg font-bold text-on-surface mt-1 block">
                      {fmtCurrency(lastSettlement.total_ingredient_cost || lastSettlement.totalIngredientCost)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 col-span-2 sm:col-span-1">
                    <span className="text-xs text-on-surface-variant font-medium block">Members Processed</span>
                    <span className="text-lg font-bold text-on-surface mt-1 block">
                      {(lastSettlement.results || []).length} Members
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-Member Results Breakdown Table */}
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-surface-container-high">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">people</span>
                    Per-Member Settlement Breakdown
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Individual meal charges, previous deposit balances, deducted sums, and resulting status.
                  </p>
                </div>

                {(!lastSettlement.results || lastSettlement.results.length === 0) ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    No per-member itemization was attached to this settlement summary.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Member</th>
                          <th className="py-3 px-4">Total Due</th>
                          <th className="py-3 px-4">Prev Deposit</th>
                          <th className="py-3 px-4">Deducted</th>
                          <th className="py-3 px-4">Settlement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high/60">
                        {lastSettlement.results.map((item, idx) => (
                          <tr key={item.userId || idx} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap font-bold text-on-surface">
                              {item.name}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-on-surface">
                              {fmtCurrency(item.totalDue)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-on-surface-variant">
                              {fmtCurrency(item.previousDepositBalance)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-bold text-rose-600">
                              - {fmtCurrency(item.deductedAmount)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {renderSettlementStatusBadge(item.settlementStatus)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUMMARY / PREVIEW TAB (GET /bills/summary) */}
      {/* ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Controls & Date Range Picker */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-surface-container-high">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">date_range</span>
                  Cycle Date Range Picker
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Select the billing cycle period to preview pro-rata costs and attendance totals.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyDatePreset('this-month')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('last-month')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                >
                  Last Month
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset('last-14-days')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                >
                  14 Days
                </button>
              </div>
            </div>

            {/* Date Input Form */}
            <form onSubmit={handleCalculateSummary} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoadingSummary}
                  className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoadingSummary ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">calculate</span>
                      <span>Calculate Preview</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-on-surface-variant/80">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              <span>This is a read-only preview calculation and will <strong>not</strong> deduct any funds.</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingSummary && (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3"></div>
              <span className="text-sm font-semibold text-on-surface-variant">Calculating billing summary preview...</span>
            </div>
          )}

          {/* Error State */}
          {!isLoadingSummary && errorSummary && (
            <div className="p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px]">error</span>
              </div>
              <p className="text-sm font-bold text-on-surface mb-1">Failed to Calculate Summary</p>
              <p className="text-xs text-on-surface-variant max-w-sm mb-4">{errorSummary}</p>
              <button
                type="button"
                onClick={() => handleCalculateSummary()}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          )}

          {/* Summary Preview Content */}
          {!isLoadingSummary && !errorSummary && summaryData && (
            <div className="space-y-6">
              {/* Pool Summary Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
                  <span className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                    Total Food Cost
                  </span>
                  <span className="text-2xl font-extrabold text-on-surface mt-1 block">
                    {fmtCurrency(summaryData.poolSummary?.totalFoodPrice)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5 block">Shared among diners who ate</span>
                </div>

                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs">
                  <span className="text-xs font-semibold text-on-surface-variant block uppercase tracking-wider">
                    Total Ingredient Cost
                  </span>
                  <span className="text-2xl font-extrabold text-on-surface mt-1 block">
                    {fmtCurrency(summaryData.poolSummary?.totalIngredientPrice)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5 block">Pantry & spices across active household</span>
                </div>

                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 shadow-xs">
                  <span className="text-xs font-semibold text-primary block uppercase tracking-wider">
                    Active Diners / Total
                  </span>
                  <span className="text-2xl font-extrabold text-primary mt-1 block">
                    {summaryData.activeMembersCount} / {summaryData.totalMembers}
                  </span>
                  <span className="text-[11px] text-primary/80 mt-0.5 block">Members in household pool</span>
                </div>
              </div>

              {/* Members Breakdown Table */}
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-high">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">table_chart</span>
                      Member Dues Breakdown (Preview)
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Period: {summaryData.period.startDate} to {summaryData.period.endDate}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settle')}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">paid</span>
                      Proceed to Settle
                    </button>
                  )}
                </div>

                {summaryData.memberSummaries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant">
                    No members found for this cycle range.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Member</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Days Eaten</th>
                          <th className="py-3 px-4">Food Cost</th>
                          <th className="py-3 px-4">Ingredient Cost</th>
                          <th className="py-3 px-4 text-right">Total Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high/60">
                        {summaryData.memberSummaries.map((m) => (
                          <tr key={m.memberId} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-bold text-on-surface block">{m.name}</span>
                              <span className="text-[11px] text-on-surface-variant font-mono">@{m.username}</span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  m.status === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : m.status === 'AWAY'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-medium text-on-surface">
                              {m.daysEaten} days
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-on-surface">
                              {fmtCurrency(m.foodCost)}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap text-on-surface">
                              {fmtCurrency(m.ingredientCost)}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-sm text-primary">
                              {fmtCurrency(m.totalDue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SETTLE & DEDUCT TAB (POST /bills/settle) - ADMIN ONLY */}
      {/* ========================================================================= */}
      {activeTab === 'settle' && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">warning</span>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">Irreversible Action: Settle & Deduct Funds</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Executing a settlement will calculate each member's dues for the specified date range and automatically deduct that amount from their active prepaid deposit balance in the database.
              </p>
            </div>
          </div>

          {/* Settle Configuration Box */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2 pb-3 border-b border-surface-container-high">
              <span className="material-symbols-outlined text-rose-600 text-[20px]">currency_exchange</span>
              Execute Billing Cycle Settlement
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Cycle Start Date <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Cycle End Date <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-container-high">
              <p className="text-xs text-on-surface-variant">
                Range selected: <span className="font-bold text-on-surface">{startDate}</span> to{' '}
                <span className="font-bold text-on-surface">{endDate}</span>
              </p>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={isSettling || !startDate || !endDate}
                className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm shadow-xs hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">paid</span>
                <span>Settle & Deduct Deposits</span>
              </button>
            </div>
          </div>

          {/* Settle Results Table (if settlement was just performed) */}
          {settleResults && (
            <div className="rounded-2xl border border-emerald-500/30 bg-surface-container-lowest overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                  <div>
                    <h3 className="text-base font-bold text-emerald-950">Settlement Successfully Processed</h3>
                    <p className="text-xs text-emerald-800">{settleResults.message}</p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-emerald-800">
                  {settleResults.period ? `${settleResults.period.startDate} → ${settleResults.period.endDate}` : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Total Due</th>
                      <th className="py-3 px-4">Prev Deposit Balance</th>
                      <th className="py-3 px-4">Deducted Amount</th>
                      <th className="py-3 px-4">Resulting Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60">
                    {settleResults.results.map((r, idx) => (
                      <tr key={r.userId || idx} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-on-surface">
                          {r.name}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-on-surface">
                          {fmtCurrency(r.totalDue)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-on-surface-variant">
                          {fmtCurrency(r.previousDepositBalance)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-rose-600">
                          - {fmtCurrency(r.deductedAmount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderSettlementStatusBadge(r.settlementStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SETTLEMENT HISTORY TAB (GET /bills/settlements?limit=10&offset=0) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-high">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                  Settlement Cycles Log
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Historical overview of all closed billing cycles and total funds distributed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchSettlementsHistory(historyOffset)}
                disabled={isLoadingHistory}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isLoadingHistory ? 'animate-spin' : ''}`}>
                  sync
                </span>
                Refresh
              </button>
            </div>

            {isLoadingHistory && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3"></div>
                <span className="text-sm font-semibold text-on-surface-variant">Loading settlement history...</span>
              </div>
            )}

            {!isLoadingHistory && errorHistory && (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">error</span>
                </div>
                <p className="text-sm font-bold text-on-surface mb-1">Could Not Load History</p>
                <p className="text-xs text-on-surface-variant max-w-sm mb-4">{errorHistory}</p>
                <button
                  type="button"
                  onClick={() => fetchSettlementsHistory(historyOffset)}
                  className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoadingHistory && !errorHistory && (!historyData || historyData.settlements.length === 0) && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">receipt_long</span>
                </div>
                <p className="text-sm font-bold text-on-surface mb-1">No Past Settlements Found</p>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  When administrators settle billing cycles, they will appear in this timeline.
                </p>
              </div>
            )}

            {!isLoadingHistory && !errorHistory && historyData && historyData.settlements.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Cycle Period</th>
                        <th className="py-3 px-4">Settled By</th>
                        <th className="py-3 px-4">Food Cost</th>
                        <th className="py-3 px-4">Ingredient Cost</th>
                        <th className="py-3 px-4">Total Settled</th>
                        <th className="py-3 px-4 text-right">Settled At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/60">
                      {historyData.settlements.map((s) => {
                        const dateFormatted = s.created_at
                          ? new Date(s.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—';

                        return (
                          <tr key={s.id} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-on-surface whitespace-nowrap">
                              {s.start_date} → {s.end_date}
                            </td>
                            <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap">
                              {s.settled_by_name || 'Admin'}
                            </td>
                            <td className="py-3.5 px-4 text-on-surface whitespace-nowrap">
                              {fmtCurrency(s.total_food_cost)}
                            </td>
                            <td className="py-3.5 px-4 text-on-surface whitespace-nowrap">
                              {fmtCurrency(s.total_ingredient_cost)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-primary whitespace-nowrap">
                              {fmtCurrency(s.total_due_all)}
                            </td>
                            <td className="py-3.5 px-4 text-right text-on-surface-variant whitespace-nowrap">
                              {dateFormatted}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-surface-container-high flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    Showing {historyOffset + 1}–{Math.min(historyOffset + historyData.settlements.length, historyData.total)} of{' '}
                    {historyData.total} settlements
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchSettlementsHistory(Math.max(0, historyOffset - historyLimit))}
                      disabled={historyOffset === 0 || isLoadingHistory}
                      className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => fetchSettlementsHistory(historyOffset + historyLimit)}
                      disabled={historyOffset + historyLimit >= historyData.total || isLoadingHistory}
                      className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL FOR SETTLEMENT */}
      {/* ========================================================================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/60 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-on-surface">Confirm Settlement & Deduction</h3>
              <p className="text-xs text-on-surface-variant">
                Are you sure you want to execute cycle settlement for:
              </p>
              <div className="mt-2 py-2 px-3 rounded-xl bg-surface-container-low font-bold text-xs text-on-surface">
                {startDate} to {endDate}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left text-xs text-amber-900 space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">report_problem</span>
                Irreversible Action
              </span>
              <p>
                This will automatically deduct calculated meal dues directly from each member's active deposit balance. This cannot be undone automatically.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSettling}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant bg-surface font-bold text-xs text-on-surface hover:bg-surface-container transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteSettle}
                disabled={isSettling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSettling ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Yes, Settle Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
