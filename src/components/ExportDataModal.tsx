import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ApiUser, DailyCostRecord, MealStatusRecord } from '../api/types';
import { useLanguage } from '../context/LanguageContext';
import {
  exportExpensesToCsv,
  exportAttendanceToCsv,
  exportCombinedReportToCsv,
} from '../utils/csvExport';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ApiUser | null;
  dailyCosts?: DailyCostRecord[];
  mealStatuses?: MealStatusRecord[];
  members?: ApiUser[];
  onShowToast: (msg: string, icon?: string) => void;
  onOpenAuth?: () => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  dailyCosts: initialDailyCosts = [],
  mealStatuses: initialMealStatuses = [],
  members: initialMembers = [],
  onShowToast,
  onOpenAuth,
}) => {
  const { language, t } = useLanguage();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [costs, setCosts] = useState<DailyCostRecord[]>(initialDailyCosts);
  const [attendances, setAttendances] = useState<MealStatusRecord[]>(initialMealStatuses);
  const [memberList, setMemberList] = useState<ApiUser[]>(initialMembers);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  // Sync props and fetch fresh data if needed
  useEffect(() => {
    if (!isOpen) return;

    if (initialDailyCosts.length > 0) setCosts(initialDailyCosts);
    if (initialMealStatuses.length > 0) setAttendances(initialMealStatuses);
    if (initialMembers.length > 0) setMemberList(initialMembers);

    // Refresh if empty or to ensure complete dataset
    const fetchFreshData = async () => {
      setIsLoading(true);
      try {
        const [freshCosts, freshAttendances, freshMembers] = await Promise.all([
          api.dailyCosts.getAll().catch(() => initialDailyCosts),
          api.mealStatuses.getAll().catch(() => initialMealStatuses),
          api.members.getAll().catch(() => initialMembers),
        ]);
        if (Array.isArray(freshCosts)) setCosts(freshCosts);
        if (Array.isArray(freshAttendances)) setAttendances(freshAttendances);
        if (Array.isArray(freshMembers)) setMemberList(freshMembers);
      } catch (err) {
        console.warn('Failed to refresh data for export:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreshData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportExpenses = () => {
    if (!isAdmin) {
      onShowToast(
        language === 'km'
          ? 'តម្រូវឱ្យមានសិទ្ធិជា Admin ដើម្បីទាញយកទិន្នន័យ'
          : 'Administrator privileges are required to export data',
        'shield'
      );
      return;
    }

    if (costs.length === 0) {
      onShowToast(
        language === 'km' ? 'មិនមានកំណត់ត្រាចំណាយសម្រាប់ទាញយកទេ' : 'No expense records found to export',
        'info'
      );
      return;
    }

    setDownloadingType('expenses');
    try {
      const filename = exportExpensesToCsv(costs);
      onShowToast(
        language === 'km'
          ? `បានទាញយក ${filename} ដោយជោគជ័យ`
          : `Downloaded ${filename} successfully`,
        'download_done'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Export failed', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportAttendance = () => {
    if (!isAdmin) {
      onShowToast(
        language === 'km'
          ? 'តម្រូវឱ្យមានសិទ្ធិជា Admin ដើម្បីទាញយកទិន្នន័យ'
          : 'Administrator privileges are required to export data',
        'shield'
      );
      return;
    }

    if (attendances.length === 0) {
      onShowToast(
        language === 'km'
          ? 'មិនមានកំណត់ត្រាវត្តមានសម្រាប់ទាញយកទេ'
          : 'No meal attendance records found to export',
        'info'
      );
      return;
    }

    setDownloadingType('attendance');
    try {
      const filename = exportAttendanceToCsv(attendances, memberList);
      onShowToast(
        language === 'km'
          ? `បានទាញយក ${filename} ដោយជោគជ័យ`
          : `Downloaded ${filename} successfully`,
        'download_done'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Export failed', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportCombined = () => {
    if (!isAdmin) {
      onShowToast(
        language === 'km'
          ? 'តម្រូវឱ្យមានសិទ្ធិជា Admin ដើម្បីទាញយកទិន្នន័យ'
          : 'Administrator privileges are required to export data',
        'shield'
      );
      return;
    }

    setDownloadingType('combined');
    try {
      const filename = exportCombinedReportToCsv(costs, attendances, memberList);
      onShowToast(
        language === 'km'
          ? `បានទាញយក ${filename} ដោយជោគជ័យ`
          : `Downloaded ${filename} successfully`,
        'download_done'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Export failed', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportAll = async () => {
    if (!isAdmin) {
      onShowToast(
        language === 'km'
          ? 'តម្រូវឱ្យមានសិទ្ធិជា Admin ដើម្បីទាញយកទិន្នន័យ'
          : 'Administrator privileges are required to export data',
        'shield'
      );
      return;
    }

    setDownloadingType('all');
    try {
      if (costs.length > 0) exportExpensesToCsv(costs);
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (attendances.length > 0) exportAttendanceToCsv(attendances, memberList);
      await new Promise((resolve) => setTimeout(resolve, 300));
      exportCombinedReportToCsv(costs, attendances, memberList);

      onShowToast(
        language === 'km'
          ? 'បានទាញយកឯកសារ CSV ទាំងអស់រួចរាល់'
          : 'All CSV export files downloaded successfully',
        'download_done'
      );
    } catch (err: any) {
      onShowToast(err.message || 'Bulk export failed', 'error');
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">file_download</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                  {language === 'km' ? 'ទាញយកទិន្នន័យ (Export Data)' : 'Export Household Data'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  CSV
                </span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {language === 'km'
                  ? 'ទាញយកប្រវត្តិចំណាយ និងវត្តមានអាហារជាឯកសារ Excel/CSV'
                  : 'Download expense history & meal attendance spreadsheets'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Admin Role Status Warning if Not Admin */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-on-surface flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[22px] shrink-0 mt-0.5">
                  shield_lock
                </span>
                <div>
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    {language === 'km' ? 'តម្រូវឱ្យមានគណនី Admin' : 'Admin Privileges Required'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    {language === 'km'
                      ? 'មានតែអ្នកគ្រប់គ្រង (Admin) ប៉ុណ្ណោះដែលអាចទាញយកកំណត់ត្រាហិរញ្ញវត្ថុ និងវត្តមានរបស់សមាជិកទាំងអស់ក្នុងផ្ទះ។'
                      : 'Only system administrators can download the full household financial history and meal attendance records as CSV files.'}
                  </p>
                </div>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  <span>{language === 'km' ? 'ចូលគណនីជា Admin' : 'Sign in as Admin'}</span>
                </button>
              )}
            </div>
          )}

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-on-surface-variant font-medium block">
                  {language === 'km' ? 'កំណត់ត្រាចំណាយ' : 'Expenses Logged'}
                </span>
                <span className="text-lg font-extrabold text-on-surface">
                  {isLoading ? '...' : `${costs.length} ${language === 'km' ? 'ថ្ងៃ' : 'records'}`}
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[22px]">receipt_long</span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-on-surface-variant font-medium block">
                  {language === 'km' ? 'វត្តមានអាហារ' : 'Meal Attendance'}
                </span>
                <span className="text-lg font-extrabold text-on-surface">
                  {isLoading ? '...' : `${attendances.length} ${language === 'km' ? 'ជម្រើស' : 'records'}`}
                </span>
              </div>
              <span className="material-symbols-outlined text-primary text-[22px]">restaurant</span>
            </div>
          </div>

          {/* Export Option 1: Expense History */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60 hover:border-primary/40 transition-all flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">receipt</span>
                </div>
                <div>
                  <h3 className="font-title-md text-sm font-bold text-on-surface">
                    {language === 'km' ? 'ប្រវត្តិចំណាយប្រចាំថ្ងៃ (Daily Expense History)' : 'Expense History'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {language === 'km'
                      ? 'ថ្លៃម្ហូប គ្រឿងទេស ចំនួនអ្នកហូប និងថ្លៃក្នុងម្នាក់ៗ'
                      : 'Includes food price, ingredient costs, eaters count & per-diner calculations'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full shrink-0">
                {costs.length} rows
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportExpenses}
              disabled={!isAdmin || downloadingType === 'expenses'}
              className="mt-1 w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">download</span>
              <span>
                {downloadingType === 'expenses'
                  ? language === 'km' ? 'កំពុងទាញយក...' : 'Downloading...'
                  : language === 'km' ? 'ទាញយក Expense History (CSV)' : 'Download Expenses (CSV)'}
              </span>
            </button>
          </div>

          {/* Export Option 2: Meal Attendance Records */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60 hover:border-primary/40 transition-all flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                </div>
                <div>
                  <h3 className="font-title-md text-sm font-bold text-on-surface">
                    {language === 'km' ? 'កំណត់ត្រាវត្តមានអាហារ (Meal Attendance Records)' : 'Meal Attendance Records'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {language === 'km'
                      ? 'ឈ្មោះសមាជិក កាលបរិច្ឆេទ ស្ថានភាពហូប/មិនហូប និងថ្លៃបែងចែក'
                      : 'Member participation (EAT / NOT_EAT), date, cost allocations & timestamps'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full shrink-0">
                {attendances.length} rows
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportAttendance}
              disabled={!isAdmin || downloadingType === 'attendance'}
              className="mt-1 w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">download</span>
              <span>
                {downloadingType === 'attendance'
                  ? language === 'km' ? 'កំពុងទាញយក...' : 'Downloading...'
                  : language === 'km' ? 'ទាញយក Meal Attendance (CSV)' : 'Download Attendance (CSV)'}
              </span>
            </button>
          </div>

          {/* Export Option 3: Combined Summary Report */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60 hover:border-primary/40 transition-all flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">table_chart</span>
                </div>
                <div>
                  <h3 className="font-title-md text-sm font-bold text-on-surface">
                    {language === 'km' ? 'របាយការណ៍សង្ខេបរួម (Combined Daily Report)' : 'Combined Daily Report'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {language === 'km'
                      ? 'តារាងរួមប្រចាំថ្ងៃ៖ ថ្លៃសរុប រួមជាមួយបញ្ជីឈ្មោះអ្នកហូប និងអ្នកខកខាន'
                      : 'Single consolidated spreadsheet: daily cost alongside names of who ate and skipped'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportCombined}
              disabled={!isAdmin || downloadingType === 'combined'}
              className="mt-1 w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">download</span>
              <span>
                {downloadingType === 'combined'
                  ? language === 'km' ? 'កំពុងទាញយក...' : 'Downloading...'
                  : language === 'km' ? 'ទាញយក Combined Report (CSV)' : 'Download Combined Report (CSV)'}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-surface-container-high/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            {t.common.close}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleExportAll}
              disabled={downloadingType === 'all'}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 active:scale-98 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">sim_card_download</span>
              <span>
                {downloadingType === 'all'
                  ? language === 'km' ? 'កំពុងដំណើរការ...' : 'Exporting...'
                  : language === 'km' ? 'ទាញយកទាំងអស់ (Export All CSV)' : 'Export All (CSV)'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
