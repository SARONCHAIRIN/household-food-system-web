import React, { useState } from 'react';
import { getBaseUrl, setCustomBaseUrl, LIVE_API_URL, LOCAL_API_URL } from '../api/client';

interface ApiServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerChanged: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ApiServerModal: React.FC<ApiServerModalProps> = ({
  isOpen,
  onClose,
  onServerChanged,
  onShowToast,
}) => {
  const current = getBaseUrl();
  const [selectedUrl, setSelectedUrl] = useState<string>(current);
  const [customInput, setCustomInput] = useState<string>(
    current !== LIVE_API_URL && current !== LOCAL_API_URL ? current : ''
  );

  if (!isOpen) return null;

  const handleSave = (urlToSave: string) => {
    const trimmed = urlToSave.trim();
    if (!trimmed) {
      onShowToast('Please enter a valid API URL', 'error');
      return;
    }
    setCustomBaseUrl(trimmed);
    onShowToast(`Backend switched to: ${trimmed}`, 'sync');
    onServerChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/60 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">dns</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">API Backend Configuration</h3>
              <p className="text-xs text-on-surface-variant">Select or change the backend server URL</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Cloud Render Live Option */}
          <button
            type="button"
            onClick={() => {
              setSelectedUrl(LIVE_API_URL);
              handleSave(LIVE_API_URL);
            }}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              selectedUrl === LIVE_API_URL
                ? 'border-primary bg-primary/5 shadow-xs'
                : 'border-outline-variant/60 hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">cloud</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">Cloud Server (Render - HTTPS Live)</span>
                {selectedUrl === LIVE_API_URL && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant truncate font-mono mt-0.5">{LIVE_API_URL}</p>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                ✓ Recommended for HTTPS preview (No mixed-content blocks)
              </span>
            </div>
          </button>

          {/* Localhost Option */}
          <button
            type="button"
            onClick={() => {
              setSelectedUrl(LOCAL_API_URL);
              handleSave(LOCAL_API_URL);
            }}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              selectedUrl === LOCAL_API_URL
                ? 'border-primary bg-primary/5 shadow-xs'
                : 'border-outline-variant/60 hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[22px] shrink-0 mt-0.5">laptop</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">Local Backend (localhost:10000)</span>
                {selectedUrl === LOCAL_API_URL && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant truncate font-mono mt-0.5">{LOCAL_API_URL}</p>
              <span className="text-[10px] text-on-surface-variant block mt-1">
                Use when running the Node/Go backend locally on machine port 10000
              </span>
            </div>
          </button>

          {/* Custom URL Option */}
          <div className="pt-2 border-t border-surface-container-high space-y-2">
            <label className="block text-xs font-bold text-on-surface-variant">
              Custom Endpoint URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="https://my-backend.domain.com/api/v1"
                className="flex-1 h-10 px-3 rounded-xl border border-outline-variant bg-surface text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => {
                  if (customInput) handleSave(customInput);
                }}
                disabled={!customInput}
                className="px-4 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold disabled:opacity-40"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
