import React from 'react';
import { NavTab } from '../types';
import { ApiUser } from '../api/types';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: ApiUser | null; // បន្ថែម currentUser សម្រាប់ពិនិត្យសិទ្ធិ
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, currentUser }) => {
  const { t } = useLanguage();
  const isAdmin = currentUser?.role === 'ADMIN';

  const allTabs: { id: NavTab; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: 'grid_view' },
    { id: 'meals', label: t.nav.meals, icon: 'restaurant' },
    { id: 'deposits', label: t.nav.deposits, icon: 'account_balance_wallet' },
    { id: 'bills', label: t.nav.bills, icon: 'receipt_long', adminOnly: true }, // កំណត់ថាសម្រាប់តែ Admin តែប៉ុណ្ណោះ
    { id: 'profile', label: t.nav.profile, icon: 'manage_accounts' },
  ];

  // តម្រងទិន្នន័យ៖ បើមិនមែនជា Admin ទេ គឺលុបផ្ទាំងណាដែលមាន adminOnly ចោល
  const tabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(15,23,42,0.06)] border-t border-surface-container-high/50 transition-colors">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg md:max-w-xl mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[54px] min-h-[44px] px-3 transition-colors relative ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="font-label-sm text-[11px] leading-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};