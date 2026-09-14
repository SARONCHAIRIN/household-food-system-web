import React, { useState, useEffect } from 'react';
import {
  PostSettlementReceiptData,
  PostSettlementMemberResult,
  buildMemberSettlementReceiptPdf,
  buildMasterSettlementReceiptPdf,
  downloadPdf,
  printPdf,
  sharePdf,
} from '../services/settlementReportGenerator';
import { useApp } from '../context/AppContext';

interface SettlementReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: PostSettlementReceiptData | null;
}

const DEFAULT_EXCHANGE_RATE = 4000;

/**
 * Format helper for dual currency values (KHR primary, USD sub-display)
 */
const renderDual = (amountKHR: number, exchangeRate: number = DEFAULT_EXCHANGE_RATE) => {
  const khr = Math.round(Number(amountKHR) || 0);
  const usd = (khr / exchangeRate).toFixed(2);
  return {
    khr: `${khr.toLocaleString()} ៛`,
    usd: `$${usd}`,
    combined: `${khr.toLocaleString()} ៛ ($${usd})`,
  };
};

export const SettlementReceiptModal: React.FC<SettlementReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const { t, language } = useApp();
  const [activeTab, setActiveTab] = useState<string>('master');
  const [sharing, setSharing] = useState(false);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('master');
      setActionMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !receiptData) return null;

  const showNotification = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => {
      setActionMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const selectedMember: PostSettlementMemberResult | undefined = receiptData.members.find(
    (m) => String(m.userId) === activeTab
  );

  const handleDownloadCurrent = () => {
    if (activeTab === 'master') {
      const doc = buildMasterSettlementReceiptPdf(receiptData, language);
      const filename = `household_settlement_receipt_${receiptData.period.startDate}_${receiptData.period.endDate}_ref${receiptData.receiptId}.pdf`;
      downloadPdf(doc, filename);
      showNotification(language === 'km' ? 'បានទាញយកវិក្កយបត្រទូទាត់មេជា PDF' : 'Master Settlement Receipt PDF downloaded.');
    } else if (selectedMember) {
      const doc = buildMemberSettlementReceiptPdf(receiptData, selectedMember, language);
      const safeName = selectedMember.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `settlement_receipt_${safeName}_ref${receiptData.receiptId}.pdf`;
      downloadPdf(doc, filename);
      showNotification(
        language === 'km'
          ? `បានទាញយកវិក្កយបត្រទូទាត់សម្រាប់ ${selectedMember.name}`
          : `Settlement Receipt for ${selectedMember.name} downloaded.`
      );
    }
  };

  const handlePrintCurrent = () => {
    if (activeTab === 'master') {
      const doc = buildMasterSettlementReceiptPdf(receiptData, language);
      printPdf(doc);
    } else if (selectedMember) {
      const doc = buildMemberSettlementReceiptPdf(receiptData, selectedMember, language);
      printPdf(doc);
    }
  };

  const handleShareCurrent = async () => {
    setSharing(true);
    try {
      if (activeTab === 'master') {
        const doc = buildMasterSettlementReceiptPdf(receiptData, language);
        const filename = `household_settlement_receipt_${receiptData.period.startDate}_${receiptData.period.endDate}_ref${receiptData.receiptId}.pdf`;
        await sharePdf(doc, filename, 'Household Settlement Receipt (Master)');
      } else if (selectedMember) {
        const doc = buildMemberSettlementReceiptPdf(receiptData, selectedMember, language);
        const safeName = selectedMember.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `settlement_receipt_${safeName}_ref${receiptData.receiptId}.pdf`;
        await sharePdf(doc, filename, `${selectedMember.name}'s Settlement Receipt`);
      }
      showNotification(language === 'km' ? 'បានបើកការចែករំលែក / រក្សាទុកវិក្កយបត្រ' : 'Share dialog opened / receipt saved.');
    } catch {
      // handled
    } finally {
      setSharing(false);
    }
  };

  const handleBatchDownloadAll = async () => {
    setBatchDownloading(true);
    try {
      const masterDoc = buildMasterSettlementReceiptPdf(receiptData, language);
      downloadPdf(
        masterDoc,
        `00_household_master_settlement_receipt_ref${receiptData.receiptId}.pdf`
      );

      for (let i = 0; i < receiptData.members.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const m = receiptData.members[i];
        const doc = buildMemberSettlementReceiptPdf(receiptData, m, language);
        const safeName = m.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        downloadPdf(doc, `receipt_${safeName}_ref${receiptData.receiptId}.pdf`);
      }

      showNotification(
        language === 'km'
          ? `បានទាញយកវិក្កយបត្រមេ និងវិក្កយបត្រសមាជិកទាំង ${receiptData.members.length}!`
          : `Downloaded Master Receipt and all ${receiptData.members.length} Member Receipts!`
      );
    } catch {
      // handled
    } finally {
      setBatchDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[var(--surface-container-lowest)] rounded-3xl shadow-2xl border border-[var(--outline)]/15 flex flex-col max-h-[92vh] overflow-hidden my-auto">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-[var(--outline)]/10 gap-3 bg-[var(--surface-container-low)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--on-surface)] tracking-tight truncate">
                  {t.settlementReceipt}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/15 border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wide">
                  {t.completedTransactionRecord}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] text-[10px] font-bold">
                  {t.permanentRef} #{receiptData.receiptId}
                </span>
              </div>
              <p className="text-xs text-[var(--on-surface-variant)] truncate">
                {t.date}: {receiptData.period.startDate} - {receiptData.period.endDate} • {receiptData.settledByName} • {receiptData.settledAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrintCurrent}
              title={t.print}
              className="min-h-[40px] px-3 rounded-xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface)] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span className="hidden sm:inline">{t.print}</span>
            </button>

            <button
              type="button"
              onClick={handleShareCurrent}
              disabled={sharing}
              title={t.share}
              className="min-h-[40px] px-3 rounded-xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface)] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span className="hidden sm:inline">{sharing ? '...' : t.share}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCurrent}
              className="min-h-[40px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{t.saveSettlementReport}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] flex items-center justify-center transition-all"
              aria-label={t.close}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Action Feedback Toast */}
        {actionMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between transition-all">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {actionMsg}
            </span>
            <button onClick={() => setActionMsg(null)} className="text-white/80 hover:text-white">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 p-2 px-4 sm:px-5 bg-[var(--surface-container)] border-b border-[var(--outline)]/10 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={`min-h-[36px] px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === 'master'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">domain</span>
            {t.masterSummary} ({receiptData.members.length})
          </button>

          <span className="text-[var(--outline)]/40 px-1">|</span>

          {receiptData.members.map((m) => {
            const isTabActive = activeTab === String(m.userId);
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => setActiveTab(String(m.userId))}
                className={`min-h-[36px] px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${isTabActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]'
                  }`}
              >
                <span>{m.name}</span>
                {m.isPaidInFull ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Paid in Full"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500" title="Insufficient Balance"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'master' ? (
            /* MASTER RECEIPT VIEW */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Top Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-emerald-700 dark:text-emerald-400">
                      verified_user
                    </span>
                    <span className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm">
                      {language === 'km' ? 'វដ្តទូទាត់ និងកាត់ប្រាក់កក់បានបញ្ចប់' : 'Cycle Settled & Deductions Executed'}
                    </span>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    {language === 'km'
                      ? 'វិក្កយបត្រនេះកត់ត្រាសមតុល្យជាក់ស្តែងជាប្រាក់រៀល (៛) និងដុល្លារ ($) ដែលបានកាត់ចេញដោយ POST /bills/settle។'
                      : 'This receipt records exact balances debited in KHR (៛) and USD ($) by POST /bills/settle at execution time.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBatchDownloadAll}
                  disabled={batchDownloading}
                  className="min-h-[38px] px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-center flex-shrink-0 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {batchDownloading ? 'sync' : 'folder_zip'}
                  </span>
                  <span>
                    {batchDownloading
                      ? language === 'km' ? 'កំពុងទាញយក...' : 'Downloading...'
                      : `${t.downloadAllReports} (${receiptData.members.length + 1})`}
                  </span>
                </button>
              </div>

              {/* Master Totals Cards (Dual Currency) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Total Amount Due */}
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 space-y-1">
                  <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block">
                    {t.amountDue} ({t.authoritative})
                  </span>
                  <span className="text-2xl font-extrabold text-[var(--primary)] block">
                    {renderDual(receiptData.summary.totalDueAll).khr}
                  </span>
                  <span className="text-xs font-bold text-[var(--primary)] block">
                    ({renderDual(receiptData.summary.totalDueAll).usd})
                  </span>
                </div>

                {/* Total Amount Deducted */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                    {t.totalAmountDeducted}
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 block">
                    {renderDual(receiptData.summary.totalDeductedAll).khr}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                    ({renderDual(receiptData.summary.totalDeductedAll).usd})
                  </span>
                </div>

                {/* Outstanding Balance */}
                <div className={`p-4 rounded-2xl border space-y-1 ${receiptData.summary.totalRemainingOwedAll > 0
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${receiptData.summary.totalRemainingOwedAll > 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                    {t.outstandingBalance}
                  </span>
                  <span className={`text-2xl font-extrabold block ${receiptData.summary.totalRemainingOwedAll > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                    {renderDual(receiptData.summary.totalRemainingOwedAll).khr}
                  </span>
                  <span className={`text-xs font-bold block ${receiptData.summary.totalRemainingOwedAll > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}>
                    ({renderDual(receiptData.summary.totalRemainingOwedAll).usd})
                  </span>
                </div>
              </div>

              {/* Master Member Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider">
                    {language === 'km' ? 'បញ្ជីប្រតិបត្តិការសមាជិក (ប្រាក់រៀល និងដុល្លារ)' : 'Member Execution Ledger (KHR & USD)'}
                  </h4>
                  <span className="text-xs text-[var(--on-surface-variant)]">
                    POST /api/v1/bills/settle
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[var(--outline)]/15">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#004f35] text-white font-bold">
                      <tr>
                        <th className="p-3">UID</th>
                        <th className="p-3">{t.members}</th>
                        <th className="p-3 text-right">{t.amountDue} (KHR / USD)</th>
                        <th className="p-3 text-right">{t.depositBefore}</th>
                        <th className="p-3 text-right">{t.amountDeducted}</th>
                        <th className="p-3 text-right">{t.depositAfter}</th>
                        <th className="p-3 text-center">{t.statusLabel}</th>
                        <th className="p-3 text-center">{t.settlementReceipt}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--outline)]/10 text-[var(--on-surface)]">
                      {receiptData.members.map((m) => {
                        const dueDual = renderDual(m.totalDue);
                        const prevDual = renderDual(m.previousDepositBalance);
                        const dedDual = renderDual(m.deductedAmount);
                        const afterDual = renderDual(m.depositAfter);

                        return (
                          <tr key={m.userId} className="hover:bg-[var(--surface-container-low)]">
                            <td className="p-3 font-mono text-[var(--on-surface-variant)]">#{m.userId}</td>
                            <td className="p-3 font-bold">{m.name}</td>
                            <td className="p-3 text-right">
                              <span className="font-bold text-[var(--primary)] block">{dueDual.khr}</span>
                              <span className="text-[10px] text-gray-500 block">({dueDual.usd})</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-semibold block">{prevDual.khr}</span>
                              <span className="text-[10px] text-gray-500 block">({prevDual.usd})</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 block">-{dedDual.khr}</span>
                              <span className="text-[10px] text-emerald-700 block">(-{dedDual.usd})</span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-mono font-semibold block">{afterDual.khr}</span>
                              <span className="text-[10px] text-gray-500 block">({afterDual.usd})</span>
                            </td>
                            <td className="p-3 text-center">
                              {m.isPaidInFull ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                                  <span className="material-symbols-outlined text-[13px]">check</span>
                                  Paid in Full
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 text-[11px] font-bold">
                                  <span className="material-symbols-outlined text-[13px]">warning</span>
                                  Partial — Owed: {renderDual(m.remainingOwed).khr}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setActiveTab(String(m.userId))}
                                className="px-2.5 py-1 rounded-lg bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--primary)] text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">receipt</span>
                                {language === 'km' ? 'មើល' : 'View'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[var(--surface-container-low)] font-bold text-[var(--on-surface)]">
                      <tr>
                        <td colSpan={2} className="p-3">
                          {t.total} ({receiptData.members.length} {t.members})
                        </td>
                        <td className="p-3 text-right text-[var(--primary)]">
                          <span className="block">{renderDual(receiptData.summary.totalDueAll).khr}</span>
                          <span className="text-[10px] font-normal text-gray-500">({renderDual(receiptData.summary.totalDueAll).usd})</span>
                        </td>
                        <td className="p-3 text-right text-[var(--on-surface-variant)]">-</td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">
                          <span className="block">-{renderDual(receiptData.summary.totalDeductedAll).khr}</span>
                          <span className="text-[10px] font-normal text-emerald-700">(-{renderDual(receiptData.summary.totalDeductedAll).usd})</span>
                        </td>
                        <td className="p-3 text-right">-</td>
                        <td colSpan={2} className="p-3 text-center text-xs">
                          {receiptData.summary.totalRemainingOwedAll > 0 ? (
                            <span className="text-red-600 font-bold block">
                              {t.outstandingBalance}: {renderDual(receiptData.summary.totalRemainingOwedAll).combined}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">{t.fullyPaidMembers}</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : selectedMember ? (
            /* INDIVIDUAL MEMBER RECEIPT VIEW (Dual Currency) */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Member Status Banner */}
              {selectedMember.isPaidInFull ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-emerald-700 dark:text-emerald-400">
                      verified
                    </span>
                    <span className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm">
                      {t.statusLabel}: {t.paidInFull}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    {language === 'km'
                      ? `ចំនួនទឹកប្រាក់ដែលត្រូវទូទាត់ ${renderDual(selectedMember.totalDue).combined} ត្រូវបានកាត់ចេញទាំងស្រុងពីប្រាក់កក់របស់ ${selectedMember.name}។`
                      : `The settlement charge of ${renderDual(selectedMember.totalDue).combined} has been deducted in full from ${selectedMember.name}'s deposit wallet.`}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-red-700 dark:text-red-400">
                      warning
                    </span>
                    <span className="font-extrabold text-red-900 dark:text-red-200 text-sm">
                      {t.statusLabel}: {t.partialBalance} — {t.remainingOwed}: {renderDual(selectedMember.remainingOwed).combined}
                    </span>
                  </div>
                  <p className="text-xs text-red-800 dark:text-red-300">
                    {language === 'km'
                      ? `ប្រាក់កក់មុន (${renderDual(selectedMember.previousDepositBalance).combined}) មិនគ្រប់គ្រាន់សម្រាប់ទូទាត់ថ្លៃត្រូវបង់ (${renderDual(selectedMember.totalDue).combined})។ បានកាត់ ${renderDual(selectedMember.deductedAmount).combined} និងនៅជំពាក់ ${renderDual(selectedMember.remainingOwed).combined}។`
                      : `Previous balance (${renderDual(selectedMember.previousDepositBalance).combined}) was insufficient for ${renderDual(selectedMember.totalDue).combined}. Deducted ${renderDual(selectedMember.deductedAmount).combined}, leaving ${renderDual(selectedMember.remainingOwed).combined} owed.`}
                  </p>
                </div>
              )}

              {/* 4 Financial Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Amount Due */}
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 space-y-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block">
                    {t.amountDue}
                  </span>
                  <span className="text-xl font-extrabold text-[var(--primary)] block">
                    {renderDual(selectedMember.totalDue).khr}
                  </span>
                  <span className="text-xs font-bold text-[var(--primary)] block">
                    ({renderDual(selectedMember.totalDue).usd})
                  </span>
                </div>

                {/* Deposit Before */}
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 space-y-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block">
                    {t.depositBefore}
                  </span>
                  <span className="text-xl font-extrabold text-[var(--on-surface)] block">
                    {renderDual(selectedMember.previousDepositBalance).khr}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-variant)] block">
                    ({renderDual(selectedMember.previousDepositBalance).usd})
                  </span>
                </div>

                {/* Amount Deducted */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                    {t.amountDeducted}
                  </span>
                  <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 block">
                    -{renderDual(selectedMember.deductedAmount).khr}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                    (-{renderDual(selectedMember.deductedAmount).usd})
                  </span>
                </div>

                {/* Deposit After */}
                <div className={`p-4 rounded-2xl border space-y-1 ${selectedMember.depositAfter < 0
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-[var(--surface-container-low)] border-[var(--outline)]/10'
                  }`}>
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider block">
                    {t.depositAfter}
                  </span>
                  <span className={`text-xl font-extrabold block ${selectedMember.depositAfter < 0 ? 'text-red-600' : 'text-[var(--on-surface)]'
                    }`}>
                    {renderDual(selectedMember.depositAfter).khr}
                  </span>
                  <span className="text-xs font-bold text-[var(--on-surface-variant)] block">
                    ({renderDual(selectedMember.depositAfter).usd})
                  </span>
                </div>
              </div>

              {/* Detailed Ledger Breakdown */}
              <div className="rounded-2xl border border-[var(--outline)]/15 overflow-hidden">
                <div className="bg-[#004f35] text-white p-3 font-bold text-xs">
                  {language === 'km' ? 'សៀវភៅប្រតិបត្តិការទូទាត់' : 'Settlement Transaction Ledger'} (POST /api/v1/bills/settle)
                </div>
                <div className="p-4 space-y-3 text-xs bg-[var(--surface-container-lowest)]">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--outline)]/10">
                    <div>
                      <span className="font-bold text-[var(--on-surface)] block">{t.amountDue}</span>
                      <span className="text-[11px] text-[var(--on-surface-variant)]">
                        {receiptData.period.startDate} - {receiptData.period.endDate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-base text-[var(--primary)] block">
                        {renderDual(selectedMember.totalDue).khr}
                      </span>
                      <span className="text-xs text-[var(--primary)] font-semibold block">
                        ({renderDual(selectedMember.totalDue).usd})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[var(--outline)]/10">
                    <div>
                      <span className="font-bold text-[var(--on-surface)] block">{t.depositBefore}</span>
                      <span className="text-[11px] text-[var(--on-surface-variant)]">
                        {language === 'km' ? 'សមតុល្យប្រាក់កក់មុនកាត់' : 'Wallet balance prior to execution'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[var(--on-surface)] block">
                        {renderDual(selectedMember.previousDepositBalance).khr}
                      </span>
                      <span className="text-xs text-[var(--on-surface-variant)] font-semibold block">
                        ({renderDual(selectedMember.previousDepositBalance).usd})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[var(--outline)]/10">
                    <div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block">{t.amountDeducted}</span>
                      <span className="text-[11px] text-[var(--on-surface-variant)]">
                        {language === 'km' ? 'បានកាត់ចេញពីកាបូបប្រាក់កក់' : 'Debited from deposit wallet'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 block">
                        -{renderDual(selectedMember.deductedAmount).khr}
                      </span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold block">
                        (-{renderDual(selectedMember.deductedAmount).usd})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[var(--outline)]/10">
                    <div>
                      <span className="font-bold text-[var(--on-surface)] block">{t.depositAfter}</span>
                      <span className="text-[11px] text-[var(--on-surface-variant)]">
                        {renderDual(selectedMember.previousDepositBalance).khr} - {renderDual(selectedMember.deductedAmount).khr}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-[var(--on-surface)] block">
                        {renderDual(selectedMember.depositAfter).khr}
                      </span>
                      <span className="text-xs text-[var(--on-surface-variant)] font-semibold block">
                        ({renderDual(selectedMember.depositAfter).usd})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="font-extrabold text-[var(--on-surface)] block">{t.statusLabel}</span>
                      <span className="text-[11px] text-[var(--on-surface-variant)]">
                        {language === 'km' ? 'ចំណាត់ថ្នាក់ប្រតិបត្តិការផ្លូវការ' : 'Official transaction classification'}
                      </span>
                    </div>
                    <div>
                      {selectedMember.isPaidInFull ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          {t.paidInFull}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 text-xs font-bold inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          {t.remainingOwed}: {renderDual(selectedMember.remainingOwed).combined}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 px-5 border-t border-[var(--outline)]/10 bg-[var(--surface-container-low)] gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">lock</span>
            <span>{t.permanentRef} #{receiptData.receiptId}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-xl bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface)] text-xs font-bold transition-all"
            >
              {t.close}
            </button>
            <button
              type="button"
              onClick={handleDownloadCurrent}
              className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{t.saveSettlementReport}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};