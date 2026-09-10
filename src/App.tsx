/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavTab } from './types';
import { api } from './api/client';
import { ApiUser, DailyCostRecord, MealStatusRecord, BillsSummaryResponse } from './api/types';
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

        {currentTab === 'bills' && (
          <BillsScreen
            currentUser={apiUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onShowToast={showToast}
            onNavigateToDeposits={() => setCurrentTab('deposits')}
          />
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

      {/* Universal Fixed Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

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
