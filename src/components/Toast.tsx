import React from 'react';
import { useApp } from '../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-[var(--primary)] text-white';
      case 'error':
        return 'bg-[var(--error)] text-white';
      default:
        return 'bg-[var(--surface-container-highest)] text-[var(--on-surface)]';
    }
  };

  return (
    <div className="fixed top-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top duration-200">
      <div
        className={`max-w-md w-full px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 pointer-events-auto border border-black/5 dark:border-white/10 ${getColors()}`}
      >
        <span className="material-symbols-outlined text-[20px] flex-shrink-0">
          {getIcon()}
        </span>
        <p className="text-xs font-semibold flex-1 leading-snug break-words">
          {toast.message}
        </p>
      </div>
    </div>
  );
};
