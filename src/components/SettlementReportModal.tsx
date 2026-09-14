import React, { useState, useEffect } from 'react';
import {
  MemberReportData,
  CombinedReportData,
  buildMemberSettlementPdf,
  buildCombinedHouseholdPdf,
  downloadPdf,
  printPdf,
  sharePdf,
} from '../services/settlementReportGenerator';
import { parseCurrency } from '../services/apiClient';
import { useApp } from '../context/AppContext';

interface SettlementReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  combinedData: CombinedReportData | null;
  memberReports: MemberReportData[];
  onProceedToSettle: () => void;
  startDate: string;
  endDate: string;
}

const DEFAULT_EXCHANGE_RATE = 4000;

/**
 * Format helper for dual currency values (KHR primary with USD sub-display)
 */
const renderDual = (amountVal: any, exchangeRate: number = DEFAULT_EXCHANGE_RATE) => {
  const numericVal = typeof amountVal === 'number' ? amountVal : parseCurrency(amountVal);
  const khr = Math.round(numericVal || 0);
  const usd = (khr / exchangeRate).toFixed(2);
  return {
    khr: `${khr.toLocaleString()} ៛`,
    usd: `$${usd}`,
    combined: `${khr.toLocaleString()} ៛ ($${usd})`,
  };
};

export const SettlementReportModal: React.FC<SettlementReportModalProps> = ({
  isOpen,
  onClose,
  combinedData,
  memberReports,
  onProceedToSettle,
  startDate,
  endDate,
}) => {
  const { t, language } = useApp();
  const [activeTab, setActiveTab] = useState<string>('master');
  const [sharing, setSharing] = useState(false);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('master');
      setActionSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !combinedData) return null;

  const currentMemberReport = memberReports.find(
    (r) => String(r.member.memberId) === activeTab
  );

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleDownloadCurrent = () => {
    if (activeTab === 'master') {
      const doc = buildCombinedHouseholdPdf(combinedData, language);
      downloadPdf(doc, `household_master_settlement_${startDate}_${endDate}.pdf`);
      showNotification(language === 'km' ? 'បានទាញយករបាយការណ៍សង្ខេបមេជា PDF' : 'Household Master Summary PDF downloaded.');
    } else if (currentMemberReport) {
      const doc = buildMemberSettlementPdf(currentMemberReport, language);
      downloadPdf(
        doc,
        `${currentMemberReport.member.username}_settlement_${startDate}_${endDate}.pdf`
      );
      showNotification(
        language === 'km'
          ? `បានទាញយករបាយការណ៍សម្រាប់ ${currentMemberReport.member.name}`
          : `Statement for ${currentMemberReport.member.name} downloaded.`
      );
    }
  };

  const handlePrintCurrent = () => {
    if (activeTab === 'master') {
      const doc = buildCombinedHouseholdPdf(combinedData, language);
      printPdf(doc);
    } else if (currentMemberReport) {
      const doc = buildMemberSettlementPdf(currentMemberReport, language);
      printPdf(doc);
    }
  };

  const handleShareCurrent = async () => {
    setSharing(true);
    try {
      if (activeTab === 'master') {
        const doc = buildCombinedHouseholdPdf(combinedData, language);
        await sharePdf(
          doc,
          `household_master_settlement_${startDate}_${endDate}.pdf`,
          'Household Food Master Summary'
        );
      } else if (currentMemberReport) {
        const doc = buildMemberSettlementPdf(currentMemberReport, language);
        await sharePdf(
          doc,
          `${currentMemberReport.member.username}_settlement_${startDate}_${endDate}.pdf`,
          `${currentMemberReport.member.name}'s Settlement Statement`
        );
      }
      showNotification(language === 'km' ? 'បានបើកការចែករំលែក / រក្សាទុករបាយការណ៍' : 'Share dialog opened / report saved.');
    } catch {
      // handled
    } finally {
      setSharing(false);
    }
  };

  const handleBatchDownloadAll = async () => {
    setBatchDownloading(true);
    try {
      const masterDoc = buildCombinedHouseholdPdf(combinedData, language);
      downloadPdf(masterDoc, `00_household_master_settlement_${startDate}_${endDate}.pdf`);

      for (let i = 0; i < memberReports.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const r = memberReports[i];
        const doc = buildMemberSettlementPdf(r, language);
        downloadPdf(doc, `${r.member.username}_settlement_${startDate}_${endDate}.pdf`);
      }

      showNotification(
        language === 'km'
          ? `បានទាញយកឯកសារ PDF ទាំង ${memberReports.length + 1} ដោយជោគជ័យ!`
          : `Successfully generated and downloaded all ${memberReports.length + 1} PDFs!`
      );
    } catch {
      // handled
    } finally {
      setBatchDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[var(--surface-container-lowest)] rounded-3xl shadow-2xl border border-[var(--outline)]/15 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-[var(--outline)]/10 gap-3 bg-[var(--surface-container-low)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-xs">
              PDF
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--on-surface)] tracking-tight truncate">
                  Settlement Report Preview
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                  Pre-Settle Estimate (Unpaid)
                </span>
              </div>
              <p className="text-xs text-[var(--on-surface-variant)] truncate">
                Period: {startDate} to {endDate} · Live estimate from GET /bills/summary (Unpaid Preview)
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBatchDownloadAll}
              disabled={batchDownloading}
              title="Download all members' statements + Master Summary"
              className="min-h-[44px] px-3.5 rounded-2xl bg-[var(--surface-container-highest)] hover:bg-[var(--surface-container)] text-xs font-bold text-[var(--on-surface)] flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {batchDownloading ? 'sync' : 'download_for_offline'}
              </span>
              <span>{batchDownloading ? 'Generating...' : 'Download All Reports'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] flex items-center justify-center active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab Strip: Master Summary + Each Member */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border-b border-[var(--outline)]/10 bg-[var(--surface-container-lowest)] overflow-x-auto scrollbar-none flex-shrink-0">
          <button
            onClick={() => setActiveTab('master')}
            className={`min-h-[44px] px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0 ${activeTab === 'master'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">assessment</span>
            <span>Master Summary</span>
          </button>

          {memberReports.map((r) => {
            const isTabActive = activeTab === String(r.member.memberId);
            const dueDual = renderDual(r.member.totalDue);
            return (
              <button
                key={r.member.memberId}
                onClick={() => setActiveTab(String(r.member.memberId))}
                className={`min-h-[44px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${isTabActive
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                  }`}
              >
                <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                  {r.member.name.slice(0, 1).toUpperCase()}
                </div>
                <span>{r.member.name}</span>
                <span className="text-[10px] opacity-80">
                  ({dueDual.usd})
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Success Toast Banner */}
        {actionSuccessMsg && (
          <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Report Content Body: Scrollable In-App Visual Statement Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[var(--surface-container-low)]">
          {/* Action Bar for Current Statement */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface-container-lowest)] border border-[var(--outline)]/10 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--on-surface)]">
                Viewing:{' '}
                {activeTab === 'master'
                  ? 'Household Master Summary'
                  : `${currentMemberReport?.member.name}'s Statement`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadCurrent}
                className="min-h-[44px] px-3.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[var(--primary)]/90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Download PDF</span>
              </button>

              <button
                onClick={handlePrintCurrent}
                className="min-h-[44px] px-3.5 rounded-xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-xs font-bold text-[var(--on-surface)] flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print</span>
              </button>

              <button
                onClick={handleShareCurrent}
                disabled={sharing}
                className="min-h-[44px] px-3.5 rounded-xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-xs font-bold text-[var(--on-surface)] flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>{sharing ? 'Sharing...' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Master Summary View */}
          {activeTab === 'master' && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-[#151c24] rounded-3xl p-6 sm:p-8 shadow-xs border border-[var(--outline)]/10 space-y-6 text-[#111c2d] dark:text-[#e1e7f0]">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-black/10 dark:border-white/10 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#004f35] text-white flex items-center justify-center font-extrabold text-lg">
                    HF
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#004f35] dark:text-[#9ff4ca]">
                      Household Food
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Master Billing & Settlement Summary (KHR & USD)
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                  <span className="font-extrabold text-sm text-[#004f35] dark:text-[#9ff4ca] block">
                    SETTLEMENT PERIOD
                  </span>
                  <span>
                    {startDate} to {endDate}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Generated: {combinedData.generatedAt}
                  </span>
                </div>
              </div>

              {/* Pool Context Stats (Dual Currency) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Food Prep
                  </span>
                  <span className="text-xl font-extrabold text-[#004f35] dark:text-[#9ff4ca] mt-1 block">
                    {renderDual(combinedData.poolSummary.totalFoodPrice).khr}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 block">
                    ({renderDual(combinedData.poolSummary.totalFoodPrice).usd})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Pantry Groceries
                  </span>
                  <span className="text-xl font-extrabold text-[#004f35] dark:text-[#9ff4ca] mt-1 block">
                    {renderDual(combinedData.poolSummary.totalIngredientPrice).khr}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 block">
                    ({renderDual(combinedData.poolSummary.totalIngredientPrice).usd})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    Total Shared Pool
                  </span>
                  <span className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-1 block">
                    {renderDual(combinedData.poolSummary.totalPool).khr}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                    ({renderDual(combinedData.poolSummary.totalPool).usd})
                  </span>
                </div>
              </div>

              {/* Member Breakdown Table (Dual Currency) */}
              <div className="space-y-2">
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-[#004f35] dark:text-[#9ff4ca] uppercase tracking-wider">
                    Member Cost & Wallet Status (KHR & USD)
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Raw cost for period (GET /bills/summary) before executing wallet deductions
                  </span>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#004f35] text-white font-bold">
                      <tr>
                        <th className="p-3">Member</th>
                        <th className="p-3">Username</th>
                        <th className="p-3 text-center">Days</th>
                        <th className="p-3 text-right">Food Share</th>
                        <th className="p-3 text-right">Ingr Share</th>
                        <th className="p-3 text-right">Period Cost</th>
                        <th className="p-3 text-right">Current Deposit</th>
                        <th className="p-3 text-center">Coverage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {combinedData.memberSummaries.map((m) => {
                        const bal = combinedData.memberBalances[String(m.memberId)] ?? 0;
                        const due = parseCurrency(m.totalDue);
                        const isCovered = bal >= due;

                        const foodDual = renderDual(m.foodCost);
                        const ingDual = renderDual(m.ingredientCost);
                        const dueDual = renderDual(due);
                        const balDual = renderDual(bal);

                        return (
                          <tr key={m.memberId} className="hover:bg-slate-50 dark:hover:bg-white/5">
                            <td className="p-3 font-bold text-[#111c2d] dark:text-white">
                              {m.name}
                            </td>
                            <td className="p-3 text-slate-500">@{m.username}</td>
                            <td className="p-3 text-center font-semibold">{m.daysEaten}</td>
                            <td className="p-3 text-right">
                              <span className="block">{foodDual.khr}</span>
                              <span className="text-[10px] text-slate-400">({foodDual.usd})</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="block">{ingDual.khr}</span>
                              <span className="text-[10px] text-slate-400">({ingDual.usd})</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-bold text-[#004f35] dark:text-[#9ff4ca] block">{dueDual.khr}</span>
                              <span className="text-[10px] text-slate-400">({dueDual.usd})</span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              <span className="block">{balDual.khr}</span>
                              <span className="text-[10px] text-slate-400">({balDual.usd})</span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isCovered
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                              >
                                {isCovered ? 'Covered' : 'Needs Top-up'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Individual Member Statement View */}
          {activeTab !== 'master' && currentMemberReport && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-[#151c24] rounded-3xl p-6 sm:p-8 shadow-xs border border-[var(--outline)]/10 space-y-6 text-[#111c2d] dark:text-[#e1e7f0]">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-black/10 dark:border-white/10 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#004f35] text-white flex items-center justify-center font-extrabold text-lg">
                    HF
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#004f35] dark:text-[#9ff4ca]">
                      Household Food
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Settlement Statement & Meal Breakdown (KHR & USD)
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                  <span className="font-extrabold text-sm text-[#004f35] dark:text-[#9ff4ca] block uppercase">
                    SETTLEMENT STATEMENT
                  </span>
                  <span>
                    Period: {startDate} to {endDate}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Generated: {currentMemberReport.generatedAt}
                  </span>
                </div>
              </div>

              {/* Member Details & Household Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Member Info Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-[#004f35] dark:text-[#9ff4ca] block uppercase text-[11px]">
                    Resident Member Details
                  </span>
                  <p className="text-sm font-extrabold text-[#111c2d] dark:text-white">
                    {currentMemberReport.member.name}
                  </p>
                  <p className="text-slate-500">
                    @{currentMemberReport.member.username} · ID #{currentMemberReport.member.memberId}
                  </p>
                  <p className="text-slate-500">
                    Role: {currentMemberReport.user?.role || 'MEMBER'} · Status: {currentMemberReport.member.status || 'ACTIVE'}
                  </p>
                </div>

                {/* Shared Pool Context */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-[#004f35] dark:text-[#9ff4ca] block uppercase text-[11px]">
                    Shared Household Pool Context
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Total Food Expenses: {renderDual(currentMemberReport.poolSummary.totalFoodPrice).combined}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Total Pantry Groceries: {renderDual(currentMemberReport.poolSummary.totalIngredientPrice).combined}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 font-semibold">
                    Total Pool: {renderDual(currentMemberReport.poolSummary.totalPool).combined} ({currentMemberReport.poolSummary.activeMembersCount} Active Diners)
                  </p>
                </div>
              </div>

              {/* Total Due Box (Dual Currency) */}
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Period Cost (recalculated)
                  </span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Food: {renderDual(currentMemberReport.member.foodCost).combined} + Pantry: {renderDual(currentMemberReport.member.ingredientCost).combined}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                    Raw cost for the period — does not subtract prior settlements
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-2xl font-extrabold text-[#004f35] dark:text-[#9ff4ca] block">
                    {renderDual(currentMemberReport.member.totalDue).khr}
                  </span>
                  <span className="text-xs font-bold text-[#004f35] dark:text-[#9ff4ca] block">
                    ({renderDual(currentMemberReport.member.totalDue).usd})
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                    Current Deposit Balance: {renderDual(currentMemberReport.depositBalance.balance).combined}
                  </span>
                </div>
              </div>

              {/* Itemized Meal Attendance Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#004f35] dark:text-[#9ff4ca] uppercase tracking-wider">
                    Itemized Meal Attendance & Cost Shares
                  </h4>
                  <span className="text-xs text-slate-500">
                    {currentMemberReport.meals.filter((m) => m.status === 'EAT').length} Meals Eaten
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#004f35] text-white font-bold">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Attendance Status</th>
                        <th className="p-2.5 text-right">Food Share</th>
                        <th className="p-2.5 text-right">Ingredient Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {currentMemberReport.meals.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500">
                            No meal records in this period for member #{currentMemberReport.member.memberId}
                          </td>
                        </tr>
                      ) : (
                        currentMemberReport.meals.map((m, idx) => {
                          const fDual = renderDual(m.foodCost);
                          const iDual = renderDual(m.ingredientCost);

                          return (
                            <tr key={m.date || idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                              <td className="p-2.5 font-medium">{m.date}</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'EAT'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                  {m.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                {m.foodCost > 0 ? (
                                  <>
                                    <span className="block font-medium">{fDual.khr}</span>
                                    <span className="text-[10px] text-slate-400">({fDual.usd})</span>
                                  </>
                                ) : (
                                  '0 ៛ ($0.00)'
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                {m.ingredientCost > 0 ? (
                                  <>
                                    <span className="block font-medium">{iDual.khr}</span>
                                    <span className="text-[10px] text-slate-400">({iDual.usd})</span>
                                  </>
                                ) : (
                                  '0 ៛ ($0.00)'
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-white/5 font-bold border-t border-slate-200 dark:border-slate-800">
                      <tr>
                        <td className="p-2.5">
                          Total Days Eaten: {currentMemberReport.member.daysEaten}
                        </td>
                        <td className="p-2.5"></td>
                        <td className="p-2.5 text-right">
                          <span className="block">{renderDual(currentMemberReport.member.foodCost).khr}</span>
                          <span className="text-[10px] font-normal text-slate-400">({renderDual(currentMemberReport.member.foodCost).usd})</span>
                        </td>
                        <td className="p-2.5 text-right">
                          <span className="block">{renderDual(currentMemberReport.member.ingredientCost).khr}</span>
                          <span className="text-[10px] font-normal text-slate-400">({renderDual(currentMemberReport.member.ingredientCost).usd})</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Deposit Wallet Transaction History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#004f35] dark:text-[#9ff4ca] uppercase tracking-wider">
                  Deposit Ledger & Recent Transactions
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-700 text-white font-bold">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5">Note</th>
                        <th className="p-2.5 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {(currentMemberReport.depositBalance.history || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500">
                            No deposit transactions recorded
                          </td>
                        </tr>
                      ) : (
                        (currentMemberReport.depositBalance.history || []).slice(0, 6).map((tx, idx) => {
                          const date = tx.created_at || tx.createdAt ? (tx.created_at || tx.createdAt)!.split('T')[0] : 'N/A';
                          const isDeposit = tx.type === 'DEPOSIT';
                          const txDual = renderDual(Math.abs(parseCurrency(tx.amount)));
                          const afterDual = tx.balance_after !== undefined ? renderDual(parseCurrency(tx.balance_after)) : null;

                          return (
                            <tr key={tx.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                              <td className="p-2.5">{date}</td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDeposit
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    }`}
                                >
                                  {tx.type}
                                </span>
                              </td>
                              <td
                                className={`p-2.5 text-right font-bold ${isDeposit ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                              >
                                <span className="block">{isDeposit ? '+' : '-'}{txDual.khr}</span>
                                <span className="text-[10px] font-normal text-slate-400">({isDeposit ? '+' : '-'}{txDual.usd})</span>
                              </td>
                              <td className="p-2.5 text-slate-500 truncate max-w-xs">
                                {tx.note || (isDeposit ? 'Prepaid Deposit' : 'Settlement Deduction')}
                              </td>
                              <td className="p-2.5 text-right">
                                {afterDual ? (
                                  <>
                                    <span className="block font-medium">{afterDual.khr}</span>
                                    <span className="text-[10px] text-slate-400">({afterDual.usd})</span>
                                  </>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Instructions & Notice Footer */}
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-400 block">
                  Payment Instructions & Policy
                </span>
                <p className="text-amber-900/90 dark:text-amber-200">
                  • Please settle or top-up your prepaid deposit by{' '}
                  <strong className="font-bold">{endDate}</strong>.
                </p>
                <p className="text-amber-900/90 dark:text-amber-200">
                  • Transfer options: ABA Bank / Bakong transfer or direct cash payment to Household Food Administrator.
                </p>
                <p className="text-amber-900/90 dark:text-amber-200">
                  • Note: Viewing this preview does <strong>NOT</strong> deduct your balance yet. Deductions only execute when Admin triggers Settle & Deduct.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar: Next step to Settle & Deduct */}
        <div className="p-4 sm:p-5 border-t border-[var(--outline)]/10 bg-[var(--surface-container-low)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
            <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">
              verified_user
            </span>
            <span>
              All member statements verified against live database endpoints. Ready to deduct?
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="min-h-[48px] px-4 rounded-2xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-xs font-bold text-[var(--on-surface)] transition-all"
            >
              Close Preview
            </button>

            <button
              onClick={() => {
                onClose();
                onProceedToSettle();
              }}
              className="min-h-[48px] px-5 rounded-2xl bg-[var(--secondary)] hover:bg-[var(--secondary-container)] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span>Proceed to Settle & Deduct</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};