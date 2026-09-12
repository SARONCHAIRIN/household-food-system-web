/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AdaptiveNavigationRail } from './components/AdaptiveNavigationRail';
import { AuthScreen } from './components/AuthScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { MealsScreen } from './components/MealsScreen';
import { DepositsScreen } from './components/DepositsScreen';
import { BillsScreen } from './components/BillsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { Toast } from './components/Toast';

const MainLayout: React.FC = () => {
  const { isAuthenticated, currentTab, setCurrentTab, userRole } = useApp();

  // Strict role-based route gate:
  // If user is not ADMIN and somehow currentTab is deposits or bills, redirect back to dashboard
  useEffect(() => {
    if (userRole !== 'ADMIN' && (currentTab === 'deposits' || currentTab === 'bills')) {
      setCurrentTab('dashboard');
    }
  }, [userRole, currentTab, setCurrentTab]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)]">
        <AuthScreen />
        <Toast />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--on-surface)] flex transition-colors duration-200">
      {/* Adaptive NavigationRail on tablet & desktop (>= 600px width) */}
      <AdaptiveNavigationRail />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {currentTab === 'dashboard' && <DashboardScreen />}
          {currentTab === 'meals' && <MealsScreen />}
          {/* Strictly role-gated routes: non-admin cannot mount Deposits or Bills */}
          {userRole === 'ADMIN' && currentTab === 'deposits' && <DepositsScreen />}
          {userRole === 'ADMIN' && currentTab === 'bills' && <BillsScreen />}
          {currentTab === 'profile' && <ProfileScreen />}
        </main>

        {/* Mobile bottom navigation bar (< 600px width) */}
        <BottomNav />
        <Toast />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
