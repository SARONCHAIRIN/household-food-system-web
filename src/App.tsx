/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavTab } from './types';
import { api } from './api/client';
import { ApiUser, DailyCostRecord, MealStatusRecord, BillsSummaryResponse, SettleBillsResponse } from './api/types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardScreen } from './components/DashboardScreen';
import { MealsScreen } from './components/MealsScreen';
import { DepositsScreen } from './components/DepositsScreen';
import { BillsScreen } from './components/BillsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AuthModal } from './components/AuthModal';
import { AddExpenseModal } from './components/Modals';
import { ManageMembersModal } from './components/ManageMembersModal';
import { ApiServerModal } from './components/ApiServerModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [apiUser, setApiUser] = useState<ApiUser | null>(() => api.auth.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isApiServerOpen, setIsApiServerOpen] = useState(false);

  // State for Export Preview Modal
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  // Holds the settlement that was JUST executed on the Settle & Deduct tab.
  // This is what the Export Preview Modal should read from — NOT billsSummary,
  // which is a different, unrelated read-only preview fetched on app load.
  const [exportPreviewData, setExportPreviewData] = useState<SettleBillsResponse | null>(null);

  // Real backend data states
  const [members, setMembers] = useState<ApiUser[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCostRecord[]>([]);
  const [mealStatuses, setMealStatuses] = useState<MealStatusRecord[]>([]);
  const [billsSummary, setBillsSummary] = useState<BillsSummaryResponse | null>(null);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active date range for Bills
  const getInitialRange = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return {
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
    };
  };

  const [dateRange, setDateRange] = useState(getInitialRange);

  // Toast notification
  const [toast, setToast] = useState<{ visible: boolean; message: string; icon: string }>({
    visible: false,
    message: '',
    icon: 'verified',
  });

  const showToast = useCallback((message: string, icon: string = 'verified') => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  // Format today's date YYYY-MM-DD
  const getTodayDateStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Master fetch function to load real data from backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch public members: GET /members
      const membersRes = await api.members.getAll();
      setMembers(Array.isArray(membersRes) ? membersRes : []);

      // If user is logged in, sync current user details from members
      const stored = api.auth.getCurrentUser();
      if (stored && Array.isArray(membersRes)) {
        const found = membersRes.find(
          (m) =>
            m.id === stored.id ||
            m.username.toLowerCase() === stored.username.toLowerCase()
        );
        if (found) {
          setApiUser(found);
        }
      }

      // If authenticated, fetch protected data
      if (api.auth.isAuthenticated()) {
        // 2. Fetch daily costs: GET /daily-costs
        try {
          const costsRes = await api.dailyCosts.getAll();
          setDailyCosts(Array.isArray(costsRes) ? costsRes : []);
        } catch (err: any) {
          console.warn('Failed to fetch daily costs:', err);
        }

        // 3. Fetch meal statuses: GET /meal-statuses
        try {
          const statusesRes = await api.mealStatuses.getAll();
          setMealStatuses(Array.isArray(statusesRes) ? statusesRes : []);
        } catch (err: any) {
          console.warn('Failed to fetch meal statuses:', err);
        }

        // 4. Fetch bills summary if user is ADMIN: GET /bills/summary
        if (stored?.role === 'ADMIN') {
          try {
            const summaryRes = await api.bills.getSummary({
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
            });
            setBillsSummary(summaryRes);
          } catch (err: any) {
            console.warn('Failed to fetch bills summary:', err);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load backend data:', err);
      setError(err.message || 'Failed to connect to backend API');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Initial load
  useEffect(() => {
    // Subscribe to unauthorized events
    const unsubscribe = api.onUnauthorized(() => {
      setApiUser(null);
      showToast('Session expired or unauthorized. Please sign in.', 'login');
      setIsAuthModalOpen(true);
    });

    // Auto-login helper if no token is present for smooth initial evaluation
    if (!api.auth.isAuthenticated()) {
      api.auth
        .login({ username: 'admin', password: 'password123' })
        .then((res) => {
          const u = api.auth.getCurrentUser();
          if (u) setApiUser(u);
          loadData();
          showToast('Connected as Admin via API', 'verified');
        })
        .catch(() => {
          // If demo admin password differed, just load public members
          loadData();
        });
    } else {
      loadData();
    }

    return () => {
      unsubscribe();
    };
  }, [loadData, showToast]);

  // Handle Attendance Toggle (POST /meal-statuses)
  const handleToggleMealStatus = async (status: 'EAT' | 'NOT_EAT', dateStr?: string) => {
    const targetDate = dateStr || getTodayDateStr();

    try {
      await api.mealStatuses.setStatus({
        date: targetDate,
        status,
      });

      showToast(
        status === 'EAT'
          ? `Marked EAT for ${targetDate}`
          : `Marked SKIPPED for ${targetDate}`,
        status === 'EAT' ? 'check_circle' : 'cancel'
      );

      // Re-fetch to reconcile state
      await loadData();
    } catch (err: any) {
      console.error('Error setting meal status:', err);
      showToast(err.message || 'Failed to update attendance', 'error');
      throw err;
    }
  };

  // Handle Admin User Status Toggle (PATCH /users/:id/status)
  const handleToggleMemberStatus = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'AWAY') => {
    try {
      await api.users.updateStatus(userId, newStatus);
      showToast(`Member status updated to ${newStatus}`, 'check_circle');
      // Re-fetch members to ensure synchronization
      const updatedMembers = await api.members.getAll();
      setMembers(updatedMembers);
    } catch (err: any) {
      console.error('Error updating member status:', err);
      showToast(err.message || 'Status update failed', 'error');
      throw err;
    }
  };

  // Handle Bills Date Range Change
  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
    showToast(`Updated range: ${start} to ${end}`);
  };

  const handleAuthSuccess = (user: ApiUser) => {
    setApiUser(user);
    loadData();
    showToast(`Signed in as ${user.name || user.username}`, 'verified');
  };

  const handleLogout = () => {
    api.auth.logout();
    setApiUser(null);
    setDailyCosts([]);
    setMealStatuses([]);
    setBillsSummary(null);
    showToast('Signed out of session', 'logout');
    loadData();
  };

  // Format currency helper (shared by Export Preview Modal)
  const fmtCurrency = (val?: string | number | null) => {
    if (val === undefined || val === null) return '$0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Total pool settled = sum of totalDue across the settlement's results
  const exportTotalPoolSettled = (exportPreviewData?.results ?? []).reduce(
    (sum, r) => sum + Number(r.totalDue || 0),
    0
  );

  // Simple CSV export of the settlement preview
  const handleDownloadSettlementCsv = () => {
    if (!exportPreviewData || !exportPreviewData.results || exportPreviewData.results.length === 0) {
      showToast('No settlement data to export', 'error');
      return;
    }

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['Member Name', 'Total Due', 'Previous Deposit Balance', 'Deducted Amount', 'Settlement Status'];
    const rows = exportPreviewData.results.map((r) =>
      [
        escapeCsv(r.name),
        escapeCsv(r.totalDue),
        escapeCsv(r.previousDepositBalance),
        escapeCsv(r.deductedAmount),
        escapeCsv(r.settlementStatus),
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const start = exportPreviewData.period?.startDate || 'start';
    const end = exportPreviewData.period?.endDate || 'end';
    link.setAttribute('href', url);
    link.setAttribute('download', `settlement_${start}_to_${end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('CSV file downloaded successfully!', 'verified');
    setIsExportPreviewOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface select-none pb-20">
      {/* Universal Fixed Header */}
      <Header
        currentTab={currentTab}
        currentUser={apiUser}
        onAvatarClick={() => setCurrentTab('profile')}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenApiSettings={() => setIsApiServerOpen(true)}
      />

      {/* Main Screen Content with Padding for fixed header */}
      <main className="flex-1 pt-20">
        {currentTab === 'dashboard' && (
          <DashboardScreen
            currentUser={apiUser}
            members={members}
            dailyCosts={dailyCosts}
            mealStatuses={mealStatuses}
            billsSummary={billsSummary}
            isLoading={isLoading}
            error={error}
            onRetry={loadData}
            onToggleMealStatus={handleToggleMealStatus}
            onToggleMemberStatus={handleToggleMemberStatus}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenManageMembers={() => setIsManageMembersOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNavigateTab={setCurrentTab}
            onShowToast={showToast}
            onOpenApiSettings={() => setIsApiServerOpen(true)}
          />
        )}

        {currentTab === 'meals' && (
          <MealsScreen
            currentUser={apiUser}
            mealStatuses={mealStatuses}
            dailyCosts={dailyCosts}
            members={members}
            isLoading={isLoading}
            error={error}
            onRetry={loadData}
            onToggleMealStatus={handleToggleMealStatus}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'deposits' && (
          <DepositsScreen
            currentUser={apiUser}
            members={members}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onShowToast={showToast}
          />
        )}

        {/* Bills Tab Guard: Admin Only */}
        {currentTab === 'bills' && (
          apiUser?.role === 'ADMIN' ? (
            <BillsScreen
              currentUser={apiUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onShowToast={showToast}
              onNavigateToDeposits={() => setCurrentTab('deposits')}
              onOpenExport={(settlement) => {
                // Preview reflects the settlement that was just executed
                // on the Settle & Deduct tab (or null if none yet this session).
                setExportPreviewData(settlement);
                setIsExportPreviewOpen(true);
              }}
            />
          ) : (
            <div className="max-w-md mx-auto px-4 py-20 text-center animate-fadeIn">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-container/30 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">lock</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface mb-1">
                Access Restricted
              </h2>
              <p className="text-xs text-on-surface-variant">
                This page is restricted to administrators only.
              </p>
            </div>
          )
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            currentUser={apiUser}
            onUpdateStatus={(st) => {
              if (apiUser) {
                handleToggleMemberStatus(apiUser.id, st);
              }
            }}
            onLogout={handleLogout}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Universal Fixed Bottom Navigation with currentUser to handle role-based filtering */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} currentUser={apiUser} />

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onExpenseAdded={() => {
          loadData();
        }}
        onShowToast={showToast}
      />

      <ManageMembersModal
        isOpen={isManageMembersOpen}
        onClose={() => setIsManageMembersOpen(false)}
        members={members}
        currentUser={apiUser}
        onUpdateMemberStatus={handleToggleMemberStatus}
        onShowToast={showToast}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <ApiServerModal
        isOpen={isApiServerOpen}
        onClose={() => setIsApiServerOpen(false)}
        onServerChanged={() => {
          loadData();
        }}
        onShowToast={showToast}
      />

      {/* Export Preview Modal — now reads from the real settlement (exportPreviewData) */}
      {isExportPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                Preview Export Data
              </h3>
              <button
                type="button"
                onClick={() => setIsExportPreviewOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Empty state: no settlement run yet this session */}
            {!exportPreviewData && (
              <div className="py-8 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">receipt_long</span>
                </div>
                <p className="text-sm font-bold text-on-surface">
                  No settlement to preview yet
                </p>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Run a settlement first using the "Settle & Deduct" tab, then click Export Data again
                  to preview and download that cycle's results.
                </p>
                <button
                  type="button"
                  onClick={() => setIsExportPreviewOpen(false)}
                  className="mt-1 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
                >
                  Got it
                </button>
              </div>
            )}

            {/* Populated state: settlement data available */}
            {exportPreviewData && (
              <>
                <p className="text-xs text-on-surface-variant">
                  Here is a preview of the settlement records ready to be exported to CSV for the cycle{' '}
                  <span className="font-semibold text-on-surface">
                    {exportPreviewData.period?.startDate} to {exportPreviewData.period?.endDate}
                  </span>
                  .
                </p>

                {/* Summary metrics */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-on-surface border-b border-surface-container-high pb-1.5">
                    <span>Metric</span>
                    <span>Value</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Total Members Processed:</span>
                    <span className="font-semibold text-on-surface">
                      {exportPreviewData.results?.length ?? 0} Members
                    </span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Total Pool Settled:</span>
                    <span className="font-semibold text-primary">
                      {fmtCurrency(exportTotalPoolSettled)}
                    </span>
                  </div>
                </div>

                {/* Per-member breakdown table */}
                <div className="rounded-2xl border border-outline-variant/40 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">Member</th>
                          <th className="py-2.5 px-3">Total Due</th>
                          <th className="py-2.5 px-3">Deducted</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-high/60">
                        {(exportPreviewData.results ?? []).map((r, idx) => {
                          const isSuccess = (r.settlementStatus || '').toUpperCase().includes('SUCCESS');
                          return (
                            <tr key={r.userId || idx}>
                              <td className="py-2 px-3 font-semibold text-on-surface whitespace-nowrap">
                                {r.name}
                              </td>
                              <td className="py-2 px-3 text-on-surface whitespace-nowrap">
                                {fmtCurrency(r.totalDue)}
                              </td>
                              <td className="py-2 px-3 font-bold text-rose-600 whitespace-nowrap">
                                -{fmtCurrency(r.deductedAmount)}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    isSuccess
                                      ? 'bg-emerald-500/10 text-emerald-700'
                                      : 'bg-amber-500/10 text-amber-700'
                                  }`}
                                >
                                  {isSuccess ? 'SETTLED' : 'PARTIAL/DEBT'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsExportPreviewOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSettlementCsv}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Confirm & Download CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Global Toast Notification */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-highest text-on-surface shadow-lg border border-surface-container-high text-xs font-semibold animate-fadeIn max-w-[90vw] truncate">
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
            {toast.icon}
          </span>
          <span className="truncate">{toast.message}</span>
        </div>
      )}
    </div>
  );
}