import React, { useState } from 'react';
import { ApiUser } from '../api/types';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ApiUser[];
  currentUser?: ApiUser | null;
  // ធ្វើបច្ចុប្បន្នភាព type ឱ្យទទួលយក AWAY ផងដែរ
  onUpdateMemberStatus: (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'AWAY') => Promise<void>;
  onShowToast: (msg: string, icon?: string) => void;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUser,
  onUpdateMemberStatus,
  onShowToast,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleStatusChange = async (m: ApiUser, newStatus: 'ACTIVE' | 'INACTIVE' | 'AWAY') => {
    if (!isAdmin) {
      onShowToast('Only administrators can change member status', 'shield');
      return;
    }
    if (m.status === newStatus) return; // បើសិនជា status ដូចเดิม រំលង
    
    setUpdatingId(m.id);
    try {
      await onUpdateMemberStatus(m.id, newStatus);
      onShowToast(`Updated ${m.name || m.username} status to ${newStatus}`, 'check_circle');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update member status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Household Members
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {members.length} members loaded from GET /members
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

        {isAdmin ? (
          <div className="mt-3 p-2.5 rounded-xl bg-primary-container/15 text-primary text-xs flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            <span>Admin mode active: Manage member statuses (Active, Inactive, Away).</span>
          </div>
        ) : (
          <div className="mt-3 p-2.5 rounded-xl bg-surface-container text-on-surface-variant text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Status updates require an Admin account.</span>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2.5">
          {members.map((m) => {
            const isCurrent = currentUser && String(currentUser.id) === String(m.id);
            const isUpdating = updatingId === m.id;

            // កំណត់ពណ៌ Badge តាម Status នីមួយៗ
            const statusColor = 
              m.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-600' :
              m.status === 'AWAY' ? 'bg-amber-500/15 text-amber-600' : 'bg-stone-500/15 text-stone-600';

            return (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {(m.name || m.username || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-label-md text-sm font-semibold text-on-surface truncate">
                        {m.name || m.username}
                      </span>
                      {isCurrent && (
                        <span className="font-label-sm text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                          YOU
                        </span>
                      )}
                      <span className="font-label-sm text-[9px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-medium">
                        {m.role}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant truncate block">
                      @{m.username} • {m.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                    {m.status}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {/* ប៊ូតុងប្ដូរ Status ទាំង 3 */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(m, 'ACTIVE')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        } ${isUpdating ? 'opacity-50' : 'active:scale-95'}`}
                      >
                        Active
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(m, 'AWAY')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          m.status === 'AWAY'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        } ${isUpdating ? 'opacity-50' : 'active:scale-95'}`}
                      >
                        Away
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(m, 'INACTIVE')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          m.status === 'INACTIVE'
                            ? 'bg-stone-600 text-white shadow-xs'
                            : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        } ${isUpdating ? 'opacity-50' : 'active:scale-95'}`}
                      >
                        Inactive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};