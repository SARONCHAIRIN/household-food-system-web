import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api, formatCurrency, parseCurrency } from '../services/apiClient';
import {
  DatePreset,
  computeDatePreset,
  detectPresetFromRange,
  formatHumanRange,
  checkSettlementOverlap,
} from '../services/billingDateUtils';
import {
  MemberReportData,
  CombinedReportData,
  MemberMealItem,
  PostSettlementReceiptData,
  createMemberReceiptItem,
} from '../services/settlementReportGenerator';
import { SettlementReportModal } from './SettlementReportModal';
import { SettlementReceiptModal } from './SettlementReceiptModal';

const DEFAULT_EXCHANGE_RATE = 4000;

/**
 * Format helper to render dual currency values (KHR ៛ and USD $)
 */
const renderDualCurrency = (amountKHR: number, exchangeRate: number = DEFAULT_EXCHANGE_RATE) => {
  const khr = Math.round(amountKHR);
  const usd = (khr / exchangeRate).toFixed(2);
  return {
    khrFormatted: `${khr.toLocaleString()} ៛`,
    usdFormatted: `$${usd}`,
  };
};

export const BillsScreen: React.FC = () => {
  const {
    currentUser,
    userRole,
    selectedBillsRange,
    updateSelectedBillsRange,
    billsSummary,
    billsSummaryLoading,
    billsSummaryError,
    lastSettlement,
    settlementHistory,
    members,
    settleCycleBills,
    refreshAllData,
    t,
    showToast,
  } = useApp();

  const [settling, setSettling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acknowledgeDoubleCharge, setAcknowledgeDoubleCharge] = useState(false);

  // Authoritative Post-Settlement Receipt State
  const [postSettlementReceipt, setPostSettlementReceipt] = useState<PostSettlementReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Single Source of Truth directly from AppContext
  const startDate = selectedBillsRange.startDate;
  const endDate = selectedBillsRange.endDate;
  const activePreset = detectPresetFromRange(selectedBillsRange);

  // Reset double charge acknowledgment whenever date range changes
  React.useEffect(() => {
    setAcknowledgeDoubleCharge(false);
  }, [startDate, endDate]);

  // Combine lastSettlement and all settlements from GET /bills/settlements
  const allSettlementsList = React.useMemo(() => {
    const list: Array<{
      id: string | number;
      start_date?: string;
      startDate?: string;
      end_date?: string;
      endDate?: string;
      settled_by_name?: string;
      settledByName?: string;
      created_at?: string;
      createdAt?: string;
      total_due_all?: number | string;
      totalDueAll?: number | string;
    }> = [];

    if (lastSettlement) {
      list.push(lastSettlement);
    }

    if (settlementHistory?.settlements) {
      for (const s of settlementHistory.settlements) {
        list.push(s);
      }
    }

    return list;
  }, [lastSettlement, settlementHistory]);

  // Check whether current selected range overlaps any prior recorded settlement
  const overlapResult = React.useMemo(() => {
    return checkSettlementOverlap(startDate, endDate, allSettlementsList);
  }, [startDate, endDate, allSettlementsList]);

  const hasOverlap = overlapResult.hasOverlap;
  const primaryOverlap = overlapResult.primaryOverlap;

  const isRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  const applyPreset = (preset: DatePreset) => {
    if (preset === 'custom') return;
    const newRange = computeDatePreset(preset);
    updateSelectedBillsRange(newRange);
  };

  const handleStartDateChange = (newStart: string) => {
    updateSelectedBillsRange({
      startDate: newStart,
      endDate: selectedBillsRange.endDate,
    });
  };

  const handleEndDateChange = (newEnd: string) => {
    updateSelectedBillsRange({
      startDate: selectedBillsRange.startDate,
      endDate: newEnd,
    });
  };

  // --- REPORT GENERATION STATE & CACHE ---
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCombinedData, setReportCombinedData] = useState<CombinedReportData | null>(null);
  const [reportMemberData, setReportMemberData] = useState<MemberReportData[]>([]);

  // Session cache to prevent repeated fetches for the same date range
  const reportCacheRef = useRef<
    Record<string, { combined: CombinedReportData; members: MemberReportData[] }>
  >({});

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      showToast('Please select valid start and end dates', 'error');
      return;
    }
    if (startDate > endDate) {
      showToast('Start date must be before or equal to end date', 'error');
      return;
    }

    const cacheKey = `${startDate}_${endDate}`;
    if (reportCacheRef.current[cacheKey]) {
      const cached = reportCacheRef.current[cacheKey];
      setReportCombinedData(cached.combined);
      setReportMemberData(cached.members);
      setIsReportModalOpen(true);
      showToast('Loaded settlement statement from session cache', 'info');
      return;
    }

    setGeneratingReport(true);
    setGenerationProgress('Fetching bills summary, meal records, and daily costs in parallel...');

    try {
      const [summaryRes, mealRes, costsRes] = await Promise.all([
        api.getBillsSummary(startDate, endDate),
        api.getMealStatuses(),
        api.getDailyCosts(),
      ]);

      const poolFood = parseCurrency(summaryRes.poolSummary?.totalFoodCostKHR ?? summaryRes.poolSummary?.totalFoodPrice ?? 0);
      const poolIngr = parseCurrency(summaryRes.poolSummary?.totalIngredientCostKHR ?? summaryRes.poolSummary?.totalIngredientPrice ?? 0);
      const totalPool = poolFood + poolIngr;

      const memberSummaries = summaryRes.memberSummaries || [];
      const generatedAt = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      const memberBalancesMap: Record<string, number> = {};
      const assembledMemberReports: MemberReportData[] = [];

      for (let i = 0; i < memberSummaries.length; i++) {
        const mem = memberSummaries[i];
        setGenerationProgress(
          `Fetching deposit wallet for ${mem.name} (${i + 1}/${memberSummaries.length})...`
        );

        let depBalanceRes;
        try {
          depBalanceRes = await api.getDepositBalance(mem.memberId);
        } catch {
          depBalanceRes = {
            userId: mem.memberId,
            balance: 0,
            userName: mem.username,
            totalTransactions: 0,
            history: [],
          };
        }

        memberBalancesMap[String(mem.memberId)] = parseCurrency(depBalanceRes.balance);

        const memberMealsRaw = mealRes.filter((m) => {
          const mId = m.memberId || m.member_id;
          if (String(mId) !== String(mem.memberId)) return false;
          const d = m.date.split('T')[0];
          return d >= startDate && d <= endDate;
        });

        const itemizedMeals: MemberMealItem[] = memberMealsRaw.map((m) => {
          const d = m.date.split('T')[0];
          const matchedCost = costsRes.find((c) => c.date.startsWith(d));
          const dayFood = parseCurrency(matchedCost?.food_price ?? matchedCost?.foodPrice ?? 0);
          const dayIngr = parseCurrency(
            matchedCost?.ingredient_price ?? matchedCost?.ingredientPrice ?? 0
          );

          const dayEaters = mealRes.filter(
            (s) => s.date.startsWith(d) && s.status === 'EAT'
          ).length;

          const myFoodShare = m.status === 'EAT' && dayEaters > 0 ? dayFood / dayEaters : 0;
          const myIngrShare =
            summaryRes.activeMembersCount > 0 ? dayIngr / summaryRes.activeMembersCount : 0;

          return {
            date: d,
            status: m.status,
            foodCost: myFoodShare,
            ingredientCost: myIngrShare,
          };
        });

        const matchedUser = members.find((u) => String(u.id) === String(mem.memberId));

        assembledMemberReports.push({
          member: mem,
          user: matchedUser,
          depositBalance: depBalanceRes,
          meals: itemizedMeals,
          poolSummary: {
            totalFoodPrice: poolFood,
            totalIngredientPrice: poolIngr,
            totalPool,
            activeMembersCount: summaryRes.activeMembersCount,
            totalMembers: summaryRes.totalMembers,
          },
          period: {
            startDate,
            endDate,
          },
          generatedAt,
        });
      }

      const combined: CombinedReportData = {
        period: {
          startDate,
          endDate,
        },
        poolSummary: {
          totalFoodPrice: poolFood,
          totalIngredientPrice: poolIngr,
          totalPool,
          activeMembersCount: summaryRes.activeMembersCount,
          totalMembers: summaryRes.totalMembers,
        },
        memberSummaries,
        memberBalances: memberBalancesMap,
        generatedAt,
      };

      reportCacheRef.current[cacheKey] = {
        combined,
        members: assembledMemberReports,
      };

      setReportCombinedData(combined);
      setReportMemberData(assembledMemberReports);
      setIsReportModalOpen(true);
      showToast('Settlement statements compiled successfully', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Report generation failed';
      showToast(msg, 'error');
    } finally {
      setGeneratingReport(false);
      setGenerationProgress('');
    }
  };

  const handleConfirmSettle = async () => {
    setShowConfirmModal(false);
    setSettling(true);

    const submitTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const adminName = currentUser?.name || currentUser?.username || 'Admin';

    try {
      const res = await settleCycleBills(startDate, endDate);
      reportCacheRef.current = {};
      showToast('Settlement and deposit deductions executed successfully', 'success');

      if (res && res.results && res.results.length > 0) {
        const freshLast = await api.getLastSettlement().catch(() => null);
        const receiptId = freshLast?.id || lastSettlement?.id || Date.now();

        const userMap = new Map<string, string>();
        members.forEach((u) => userMap.set(String(u.id), u.username || ''));

        const receiptMembers = res.results.map((r) =>
          createMemberReceiptItem({
            userId: r.userId,
            name: r.name,
            username: userMap.get(String(r.userId)),
            totalDue: r.totalDueKHR ?? r.totalDue,
            previousDepositBalance: r.previousDepositBalanceKHR ?? r.previousDepositBalance,
            deductedAmount: r.deductedAmountKHR ?? r.deductedAmount,
            settlementStatus: r.settlementStatus,
          })
        );

        const totalDueAll = receiptMembers.reduce((acc, m) => acc + m.totalDue, 0);
        const totalDeductedAll = receiptMembers.reduce((acc, m) => acc + m.deductedAmount, 0);
        const totalRemainingOwedAll = receiptMembers.reduce((acc, m) => acc + m.remainingOwed, 0);
        const fullyPaidCount = receiptMembers.filter((m) => m.isPaidInFull).length;
        const partialCount = receiptMembers.length - fullyPaidCount;

        const frozenReceiptData: PostSettlementReceiptData = {
          receiptId,
          period: {
            startDate: res.period?.startDate || startDate,
            endDate: res.period?.endDate || endDate,
          },
          settledByName: adminName,
          settledAt: submitTime,
          members: receiptMembers,
          summary: {
            totalDueAll,
            totalDeductedAll,
            totalRemainingOwedAll,
            fullyPaidCount,
            partialCount,
            totalMembers: receiptMembers.length,
          },
        };

        setPostSettlementReceipt(frozenReceiptData);
        setIsReceiptModalOpen(true);
      }
    } catch {
      // handled
    } finally {
      setSettling(false);
    }
  };

  const handleOpenLastSettlementReceipt = () => {
    if (postSettlementReceipt) {
      setIsReceiptModalOpen(true);
      return;
    }
    if (!lastSettlement || !lastSettlement.results || lastSettlement.results.length === 0) {
      showToast('No member deduction details found for the last settlement', 'info');
      return;
    }
    const userMap = new Map<string, string>();
    members.forEach((u) => userMap.set(String(u.id), u.username || ''));

    const receiptMembers = lastSettlement.results.map((r) =>
      createMemberReceiptItem({
        userId: r.userId,
        name: r.name,
        username: userMap.get(String(r.userId)),
        totalDue: r.totalDueKHR ?? r.totalDue,
        previousDepositBalance: r.previousDepositBalanceKHR ?? r.previousDepositBalance,
        deductedAmount: r.deductedAmountKHR ?? r.deductedAmount,
        settlementStatus: r.settlementStatus,
      })
    );

    const totalDueAll = parseCurrency(lastSettlement.total_due_all || lastSettlement.totalDueAll || 0);
    const totalDeductedAll = receiptMembers.reduce((acc, m) => acc + m.deductedAmount, 0);
    const totalRemainingOwedAll = receiptMembers.reduce((acc, m) => acc + m.remainingOwed, 0);
    const fullyPaidCount = receiptMembers.filter((m) => m.isPaidInFull).length;
    const partialCount = receiptMembers.length - fullyPaidCount;

    const receiptData: PostSettlementReceiptData = {
      receiptId: lastSettlement.id,
      period: {
        startDate: lastSettlement.start_date || lastSettlement.startDate || startDate,
        endDate: lastSettlement.end_date || lastSettlement.endDate || endDate,
      },
      settledByName: lastSettlement.settled_by_name || lastSettlement.settledByName || 'Admin',
      settledAt: lastSettlement.created_at || lastSettlement.createdAt || 'Recorded Settlement',
      members: receiptMembers,
      summary: {
        totalDueAll: totalDueAll || receiptMembers.reduce((acc, m) => acc + m.totalDue, 0),
        totalDeductedAll,
        totalRemainingOwedAll,
        fullyPaidCount,
        partialCount,
        totalMembers: receiptMembers.length,
      },
    };

    setPostSettlementReceipt(receiptData);
    setIsReceiptModalOpen(true);
  };

  if (userRole !== 'ADMIN') {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 text-center space-y-3 pb-28 min-[600px]:pb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center text-[var(--on-surface-variant)] mb-2">
          <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
        </div>
        <h2 className="text-lg font-bold text-[var(--on-surface)]">
          Admin Access Required
        </h2>
        <p className="text-xs text-[var(--on-surface-variant)] max-w-sm leading-relaxed">
          The bills and settlement endpoints (<code className="bg-black/5 px-1 py-0.5 rounded">/api/v1/bills/summary</code>, <code className="bg-black/5 px-1 py-0.5 rounded">/api/v1/bills/settle</code>) are protected and only accessible to users with the <strong className="text-[var(--primary)] font-bold">ADMIN</strong> role.
        </p>
      </div>
    );
  }

  // Multi-Currency Pool Numbers
  const poolFoodKHR = parseCurrency(billsSummary?.poolSummary?.totalFoodCostKHR ?? billsSummary?.poolSummary?.totalFoodPrice ?? 0);
  const poolIngredientKHR = parseCurrency(billsSummary?.poolSummary?.totalIngredientCostKHR ?? billsSummary?.poolSummary?.totalIngredientPrice ?? 0);
  const memberSummaries = billsSummary?.memberSummaries || [];
  const sumOfMemberDuesKHR = memberSummaries.reduce(
    (acc, m) => acc + parseCurrency(m.totalDueKHR ?? m.totalDue),
    0
  );

  const poolTotalKHR = memberSummaries.length > 0
    ? sumOfMemberDuesKHR
    : (poolFoodKHR + poolIngredientKHR);

  const poolFoodDual = renderDualCurrency(poolFoodKHR);
  const poolIngredientDual = renderDualCurrency(poolIngredientKHR);
  const poolTotalDual = renderDualCurrency(poolTotalKHR);

  return (
    <div className="w-full flex flex-col space-y-6 pb-28 min-[600px]:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[var(--on-surface)] tracking-tight">
              {t.cycleSettlement}
            </h1>
            <span className="font-normal text-xs text-[var(--on-surface-variant)] hidden sm:inline">
              / {t.cycleSettlementKh}
            </span>
          </div>
          <p className="text-xs text-[var(--on-surface-variant)]">
            Active cycle cost breakdown in KHR (៛) & USD ($), PDF reports & deposit deduction
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
            LIVE BILLING API (KHR / USD)
          </span>
        </div>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Date Range & Actions */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Date Range & Preset Picker */}
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[var(--primary)]">
                  date_range
                </span>
                <span className="text-sm font-bold text-[var(--on-surface)]">
                  Settlement Cycle Range
                </span>
              </div>
              <button
                onClick={refreshAllData}
                className="min-h-[40px] px-2 text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Refresh Data
              </button>
            </div>

            {/* Presets Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'this_month', label: 'This Month' },
                { id: 'last_month', label: 'Last Month' },
                { id: 'last_14_days', label: 'Last 14 Days' },
                { id: 'last_7_days', label: 'Last 7 Days' },
                { id: 'custom', label: 'Custom' },
              ].map((p) => {
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id as DatePreset)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${isSelected
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                      }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container)] text-xs font-bold text-[var(--on-surface)] outline-none shadow-xs border border-transparent focus:border-[var(--primary)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container)] text-xs font-bold text-[var(--on-surface)] outline-none shadow-xs border border-transparent focus:border-[var(--primary)] transition-all"
                />
              </div>
            </div>

            {isRangeInvalid && (
              <div className="p-3 rounded-xl bg-[var(--error-container)]/25 text-[var(--error)] text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>Invalid Range: Start Date ({startDate}) cannot be after End Date ({endDate}).</span>
              </div>
            )}
          </div>

          {/* Cycle Dual-Currency Summary Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f35] via-[#006948] to-[#004f35] text-white p-5 shadow-lg border border-white/10">
            <div className="relative z-10 flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9ff4ca]">
                    Period: {formatHumanRange(startDate, endDate)} ({startDate} to {endDate})
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {billsSummaryLoading ? (
                      <span className="inline-flex items-center gap-2 text-base text-[#9ff4ca]">
                        <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                        Calculating live preview...
                      </span>
                    ) : (
                      `${billsSummary?.activeMembersCount ?? 0} Active Residents`
                    )}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  {billsSummary?.totalMembers ?? members.length} Total
                </span>
              </div>

              <div>
                {billsSummaryLoading ? (
                  <div className="py-2.5 flex items-center gap-3">
                    <div className="h-9 w-36 bg-white/20 rounded-xl animate-pulse" />
                    <span className="text-xs font-bold text-[#9ff4ca]">Updating totals...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {poolTotalDual.khrFormatted}
                      </span>
                      <span className="text-lg font-bold text-[#9ff4ca]">
                        ({poolTotalDual.usdFormatted})
                      </span>
                    </div>
                    <p className="text-xs text-[#9ff4ca]/90 mt-1">
                      Food: {poolFoodDual.khrFormatted} (${(poolFoodKHR / DEFAULT_EXCHANGE_RATE).toFixed(2)}) | Ingredients: {poolIngredientDual.khrFormatted} (${(poolIngredientKHR / DEFAULT_EXCHANGE_RATE).toFixed(2)})
                    </p>
                    <p className="text-[11px] text-[#9ff4ca]/75 italic mt-0.5">
                      Raw period cost in KHR & USD — 1 USD = {DEFAULT_EXCHANGE_RATE.toLocaleString()} KHR
                    </p>
                  </>
                )}
              </div>

              {generatingReport && (
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#9ff4ca]">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      Compiling Settlement Statements...
                    </span>
                  </div>
                  <p className="text-white/85 text-[11px] leading-tight">
                    {generationProgress}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2.5 pt-2">
                {postSettlementReceipt && (
                  <div className="p-3.5 rounded-2xl bg-emerald-400/25 border border-emerald-300/40 text-white space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-300 text-[20px]">
                          verified
                        </span>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-xs text-white">
                            Settlement Receipt Ready
                          </span>
                          <span className="text-[10px] text-emerald-200">
                            Transaction Record • Permanent Ref #{postSettlementReceipt.receiptId}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                        Authoritative
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsReceiptModalOpen(true)}
                      className="w-full min-h-[44px] rounded-full bg-white hover:bg-emerald-50 active:scale-95 text-[#004f35] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px] text-emerald-700">
                        receipt_long
                      </span>
                      <span>Save Settlement Report (PDF)</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={generatingReport || settling || billsSummaryLoading || isRangeInvalid}
                  className="w-full min-h-[48px] rounded-full bg-white text-[#004f35] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {generatingReport ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  )}
                  <span>
                    {generatingReport ? 'Compiling Live Statements...' : 'Preview Settlement Statements (PDF)'}
                  </span>
                </button>

                {hasOverlap && primaryOverlap && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-100 text-xs space-y-2.5 animate-fadeIn">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[20px] text-amber-300 flex-shrink-0 mt-0.5">
                        warning
                      </span>
                      <div className="space-y-1">
                        <span className="font-extrabold text-white text-xs block">
                          Previous Settlement Overlap Detected
                        </span>
                        <p className="text-amber-100 text-[11px] leading-relaxed">
                          Part or all of this period ({primaryOverlap.overlapPeriodFormatted}) was already settled on {primaryOverlap.settledDate} by {primaryOverlap.settledByName} (Settlement #{primaryOverlap.id}). Settling again will deduct these amounts a second time.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/30 border border-amber-400/35 cursor-pointer text-xs select-none hover:bg-black/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={acknowledgeDoubleCharge}
                        onChange={(e) => setAcknowledgeDoubleCharge(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                      <span className="font-bold text-amber-200 text-[11px] leading-snug">
                        I understand this may double-charge members
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={
                    settling ||
                    generatingReport ||
                    billsSummaryLoading ||
                    isRangeInvalid ||
                    (hasOverlap && !acknowledgeDoubleCharge)
                  }
                  className={`w-full min-h-[48px] rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50 ${hasOverlap
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-[var(--secondary)] hover:bg-[var(--secondary-container)] text-white'
                    }`}
                >
                  {settling ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  ) : hasOverlap ? (
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  )}
                  <span>
                    {settling
                      ? 'Executing POST /bills/settle...'
                      : hasOverlap
                        ? 'Settle & Deduct Deposits (Duplicate Warning)'
                        : 'Settle & Deduct Deposits'}
                  </span>
                </button>
              </div>

              <span className="text-[11px] text-[#9ff4ca]/70 text-center block pt-1">
                Notice: Settles period {startDate} to {endDate} via POST /api/v1/bills/settle.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Currency Breakdown & Settlement History */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Member Cost Breakdown (Dual Currency KHR & USD) */}
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[var(--on-surface)]">
                  Per-Member Cost Breakdown
                </h3>
                <span className="text-xs text-[var(--on-surface-variant)]">
                  Multi-Currency breakdown (KHR ៛ & USD $)
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] text-xs font-bold">
                {memberSummaries.length} Members
              </span>
            </div>

            {billsSummaryLoading ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                <p className="text-xs font-bold text-[var(--on-surface-variant)]">
                  Loading member cost breakdown for {startDate} to {endDate}...
                </p>
              </div>
            ) : memberSummaries.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--on-surface-variant)]">
                No member summaries returned for this period.
              </div>
            ) : (
              <div className="space-y-2.5">
                {memberSummaries.map((m) => {
                  const dueKHR = parseCurrency(m.totalDueKHR ?? m.totalDue);
                  const dueUSD = m.totalDueUSD ?? (dueKHR / DEFAULT_EXCHANGE_RATE).toFixed(2);
                  const foodKHR = parseCurrency(m.foodCostKHR ?? m.foodCost);
                  const ingrKHR = parseCurrency(m.ingredientCostKHR ?? m.ingredientCost);

                  const isMemberAlreadySettled =
                    hasOverlap &&
                    (m.daysEaten > 0 ||
                      dueKHR > 0 ||
                      Boolean(
                        lastSettlement?.results?.some(
                          (r) => String(r.userId) === String(m.memberId)
                        )
                      ));

                  return (
                    <div
                      key={m.memberId}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 min-w-[40px] rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center font-bold text-[var(--on-surface)] flex-shrink-0">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[var(--on-surface)] truncate">
                              {m.name}
                            </span>
                            {isMemberAlreadySettled && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold tracking-tight">
                                <span className="material-symbols-outlined text-[13px]">history</span>
                                Already settled
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--on-surface-variant)] truncate">
                            @{m.username} · {m.daysEaten} days eaten · Food: {Math.round(foodKHR).toLocaleString()} ៛ + Ingr: {Math.round(ingrKHR).toLocaleString()} ៛
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="font-extrabold text-sm sm:text-base text-[var(--on-surface)] block">
                          {Math.round(dueKHR).toLocaleString()} ៛
                        </span>
                        <span className="block text-[10px] font-bold text-[var(--primary)]">
                          (${dueUSD})
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Verification Row */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs font-bold mt-2">
                  <div className="flex items-center gap-2 text-[var(--primary)]">
                    <span className="material-symbols-outlined text-[18px]">functions</span>
                    <span>Sum of {memberSummaries.length} member period costs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm sm:text-base text-[var(--primary)] font-extrabold block">
                      {poolTotalDual.khrFormatted}
                    </span>
                    <span className="text-[10px] text-[var(--primary)] font-semibold block">
                      ({poolTotalDual.usdFormatted})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Last Settlement Record */}
          {lastSettlement && (
            <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-[var(--on-surface)]">
                    Last Settlement Record
                  </h3>
                  <span className="text-xs text-[var(--on-surface-variant)]">
                    GET /api/v1/bills/last-settlement (ID #{lastSettlement.id})
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold">
                  Settled by {lastSettlement.settled_by_name || 'Admin'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Settlement Period:</span>
                  <span className="font-bold text-[var(--on-surface)]">
                    {formatHumanRange(lastSettlement.start_date, lastSettlement.end_date)} ({lastSettlement.start_date} to {lastSettlement.end_date})
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[var(--on-surface-variant)]">Total Due All:</span>
                  <div className="text-right">
                    <span className="font-bold text-sm text-[var(--on-surface)] block">
                      {Math.round(parseCurrency(lastSettlement.total_due_all)).toLocaleString()} ៛
                    </span>
                    <span className="text-[10px] text-[var(--on-surface-variant)] font-semibold block">
                      (${((parseCurrency(lastSettlement.total_due_all)) / DEFAULT_EXCHANGE_RATE).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>

              {lastSettlement.results && lastSettlement.results.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                      Deduction Results:
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenLastSettlementReceipt}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      <span>Save Settlement Report (PDF)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lastSettlement.results.map((res, i) => {
                      const dueKHR = parseCurrency(res.totalDueKHR ?? res.totalDue);
                      const deductedKHR = parseCurrency(res.deductedAmountKHR ?? res.deductedAmount);

                      return (
                        <div
                          key={res.userId || i}
                          className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-container)] text-xs"
                        >
                          <span className="font-semibold text-[var(--on-surface)] truncate mr-2">
                            {res.name} (UID #{res.userId})
                          </span>
                          <div className="text-right flex-shrink-0">
                            <span className="font-bold text-[var(--on-surface)] block">
                              Due: {Math.round(dueKHR).toLocaleString()} ៛
                            </span>
                            <span className="block text-[10px] text-[var(--on-surface-variant)] font-semibold">
                              Deducted: {Math.round(deductedKHR).toLocaleString()} ៛
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historical Settlements */}
          {settlementHistory && (
            <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-[var(--on-surface)]">
                    Settlement History
                  </h3>
                  <span className="text-xs text-[var(--on-surface-variant)]">
                    GET /api/v1/bills/settlements ({settlementHistory.total} logged)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {settlementHistory.settlements.map((item) => {
                  const dueKHR = parseCurrency(item.total_due_all ?? item.totalDueAll);
                  const dueUSD = (dueKHR / DEFAULT_EXCHANGE_RATE).toFixed(2);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 text-xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-[var(--on-surface)] truncate">
                          Cycle: {formatHumanRange(item.start_date, item.end_date)} ({item.start_date} ~ {item.end_date})
                        </span>
                        <span className="text-[11px] text-[var(--on-surface-variant)]">
                          By {item.settled_by_name || 'Admin'} · ID #{item.id}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="font-extrabold text-sm text-[var(--on-surface)] block">
                          {Math.round(dueKHR).toLocaleString()} ៛
                        </span>
                        <span className="block text-[10px] text-[var(--primary)] font-bold">
                          (${dueUSD})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <SettlementReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        combinedData={reportCombinedData}
        memberReports={reportMemberData}
        startDate={startDate}
        endDate={endDate}
        onProceedToSettle={() => setShowConfirmModal(true)}
      />

      <SettlementReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={postSettlementReceipt}
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface-container-lowest)] rounded-3xl p-6 shadow-2xl border border-[var(--outline)]/15 space-y-4">
            <div className="flex items-center gap-3 text-[var(--error)]">
              <div className="w-10 h-10 rounded-2xl bg-[var(--error-container)]/25 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--on-surface)]">
                  {hasOverlap ? 'Confirm Duplicate Settlement' : 'Confirm Cycle Settlement'}
                </h3>
                <span className="text-xs text-[var(--on-surface-variant)]">
                  POST /api/v1/bills/settle
                </span>
              </div>
            </div>

            {hasOverlap && primaryOverlap && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs space-y-1.5 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-200">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>Double-Settlement Warning</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  Part or all of this period ({primaryOverlap.overlapPeriodFormatted}) was already settled on {primaryOverlap.settledDate} by {primaryOverlap.settledByName} (Settlement #{primaryOverlap.id}). Settling again will deduct these amounts a second time.
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--on-surface-variant)]">Settlement Range:</span>
                <span className="font-bold text-[var(--on-surface)]">
                  {formatHumanRange(startDate, endDate)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[var(--on-surface-variant)]">Period Cost:</span>
                <div className="text-right">
                  <span className="font-bold text-base text-[var(--primary)] block">
                    {poolTotalDual.khrFormatted}
                  </span>
                  <span className="text-[10px] text-[var(--primary)] font-semibold block">
                    ({poolTotalDual.usdFormatted})
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--on-surface-variant)]">Residents Affected:</span>
                <span className="font-bold text-[var(--on-surface)]">
                  {memberSummaries.length} members
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="min-h-[48px] px-4 rounded-xl text-xs font-bold text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmSettle}
                disabled={settling}
                className={`min-h-[48px] px-5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 ${hasOverlap
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[var(--secondary)] hover:bg-[var(--secondary-container)]'
                  }`}
              >
                {settling ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                )}
                <span>
                  {hasOverlap ? 'Confirm & Double-Deduct' : 'Confirm & Deduct Deposits'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};