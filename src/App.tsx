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

import {
  requestNotificationPermission,
  listenForForegroundMessages,
} from './firebase/firebase';

const MainLayout: React.FC = () => {
  const {
    isAuthenticated,
    currentTab,
    setCurrentTab,
    userRole,
  } = useApp();

  // FCM TEST
  const handleEnableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();

      console.log('================================');
      console.log('FCM WEB TOKEN:');
      console.log(token);
      console.log('================================');

      listenForForegroundMessages();

      alert('FCM notification enabled successfully!');
    } catch (error) {
      console.error('FCM setup failed:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to enable notifications'
      );
    }
  };

  // Strict role-based route gate
  useEffect(() => {
    if (
      userRole !== 'ADMIN' &&
      (currentTab === 'deposits' || currentTab === 'bills')
    ) {
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
      {/* Adaptive NavigationRail on tablet & desktop */}
      <AdaptiveNavigationRail />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
        <Navbar />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* FCM TEST BUTTON */}
          <button
            onClick={handleEnableNotifications}
            className="mb-4 rounded-lg px-4 py-2 bg-blue-600 text-white"
          >
            🔔 Enable Web Notifications
          </button>

          {currentTab === 'dashboard' && <DashboardScreen />}

          {currentTab === 'meals' && <MealsScreen />}

          {/* Strictly role-gated routes */}
          {userRole === 'ADMIN' &&
            currentTab === 'deposits' && (
              <DepositsScreen />
            )}

          {userRole === 'ADMIN' &&
            currentTab === 'bills' && (
              <BillsScreen />
            )}

          {currentTab === 'profile' && <ProfileScreen />}

        </main>

        {/* Mobile bottom navigation */}
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