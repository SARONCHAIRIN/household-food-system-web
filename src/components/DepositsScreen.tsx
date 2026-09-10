import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import {
  ApiUser,
  DepositTransaction,
  DepositBalanceResponse,
  AdminAllDepositsResponse,
  AdminMemberDepositOverview,
} from '../api/types';

interface DepositsScreenProps {
  currentUser: ApiUser | null;
  members: ApiUser[];
  onOpenAuth: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const DepositsScreen: React.FC<DepositsScreenProps> = ({
  currentUser,
  members,
  onOpenAuth,
  onShowToast,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';

  // View Mode (Admin): Single Member Inspector vs All Members Overview
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Selected member for admin viewing / deposit adding
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUser?.id ? String(currentUser.id) : '');

  // Deposit Form State (Admin)
  const [formMemberId, setFormMemberId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Balance & History State (Single Member)
  const [balanceData, setBalanceData] = useState<DepositBalanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter for history
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'DEDUCTION'>('ALL');

  // All Members Overview State (GET /api/v1/admin/deposits/all?includeHistory=false)
  const [allMembersData, setAllMembersData] = useState<AdminAllDepositsResponse | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(false);
  const [errorAll, setErrorAll] = useState<string | null>(null);
  const [allSearch, setAllSearch] = useState<string>('');
  const [sortField, setSortField] = useState<'balance' | 'name' | 'status' | 'transactions'>('balance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Format currency helper to strictly 2 decimal places
  const fmtCurrency = (val?: string | number | null) => {
    if (val === undefined || val === null) return '$0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Sync selected member ID when currentUser becomes available
  useEffect(() => {
    if (currentUser?.id && !selectedMemberId) {
      setSelectedMemberId(String(currentUser.id));
    }
  }, [currentUser, selectedMemberId]);

  // Sync form member dropdown default
  useEffect(() => {
    if (members.length > 0 && !formMemberId) {
      setFormMemberId(String(members[0].id));
    }
  }, [members, formMemberId]);

  // Fetch Balance & History
  const fetchBalanceAndHistory = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If admin and viewing specific member, pass userId, otherwise fetch logged-in user balance
      const targetUserId = isAdmin && selectedMemberId ? selectedMemberId : undefined;
      const res = await api.deposits.getBalance(targetUserId);
      setBalanceData(res);
    } catch (err: any) {
      console.error('Error fetching deposit balance:', err);
      setError(err.message || 'Failed to load deposit balance and history.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isAdmin, selectedMemberId]);

  useEffect(() => {
    fetchBalanceAndHistory();
  }, [fetchBalanceAndHistory]);

  // Fetch All Members Overview (GET /api/v1/admin/deposits/all?includeHistory=false)
  const fetchAllMembers = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingAll(true);
    setErrorAll(null);
    try {
      const res = await api.deposits.getAllMembers(false);
      setAllMembersData(res);
    } catch (err: any) {
      console.error('Error fetching all members deposit overview:', err);
      setErrorAll(err.message || 'Failed to load all members deposit overview.');
    } finally {
      setIsLoadingAll(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllMembers();
    }
  }, [isAdmin, fetchAllMembers]);

  // Combined Refresh
  const handleRefresh = async () => {
    if (viewMode === 'all') {
      await fetchAllMembers();
    } else {
      await fetchBalanceAndHistory();
    }
  };

  // Handle Admin Add Deposit
  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      onShowToast('Only administrators can credit deposits.', 'error');
      return;
    }

    const numericUserId = Number(formMemberId);
    const numericAmount = parseFloat(amount);

    if (!numericUserId || isNaN(numericUserId)) {
      onShowToast('Please select a valid member.', 'error');
      return;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      onShowToast('Please enter a valid deposit amount greater than $0.00.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.deposits.create({
        userId: numericUserId,
        amount: numericAmount,
        note: note.trim() || undefined,
      });

      const memberName = members.find((m) => String(m.id) === String(numericUserId))?.name || `User #${numericUserId}`;
      onShowToast(`Successfully credited ${fmtCurrency(numericAmount)} to ${memberName}!`, 'check_circle');

      // Reset form fields
      setAmount('');
      setNote('');

      // Refresh balance and transactions, and all members overview
      await Promise.all([
        fetchBalanceAndHistory(),
        fetchAllMembers(),
      ]);

      // If viewing another member, switch view to this member to show updated balance
      if (selectedMemberId !== String(numericUserId)) {
        setSelectedMemberId(String(numericUserId));
      }
    } catch (err: any) {
      console.error('Failed to create deposit:', err);
      onShowToast(err.message || 'Failed to add deposit. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort and filter All Members data
  const sortedAndFilteredDeposits = useMemo(() => {
    if (!allMembersData?.deposits) return [];
    let list = [...allMembersData.deposits];

    if (allSearch.trim()) {
      const q = allSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.username && m.username.toLowerCase().includes(q)) ||
          (m.status && m.status.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'balance') {
        const balA = Number(a.balance) || 0;
        const balB = Number(b.balance) || 0;
        comparison = balA - balB;
      } else if (sortField === 'name') {
        comparison = (a.name || a.username || '').localeCompare(b.name || b.username || '');
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else if (sortField === 'transactions') {
        const txA = Number(a.totalTransactions) || 0;
        const txB = Number(b.totalTransactions) || 0;
        comparison = txA - txB;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return list;
  }, [allMembersData, allSearch, sortField, sortDirection]);

  // Handle column sort toggle
  const handleSort = (field: 'balance' | 'name' | 'status' | 'transactions') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'balance' || field === 'transactions' ? 'desc' : 'asc');
    }
  };

  // Row click in All Members: select member in dropdown and switch to single-member view
  const handleSelectMemberFromTable = (item: AdminMemberDepositOverview) => {
    setSelectedMemberId(String(item.userId));
    setFormMemberId(String(item.userId));
    setViewMode('single');
    onShowToast(`Viewing ${item.name || item.username}'s deposit details`, 'person');
  };

  // Summary strip computations for All Members
  const totalMembersCount = allMembersData?.totalMembers ?? (allMembersData?.deposits?.length || 0);
  const totalBalanceAll = useMemo(() => {
    return (allMembersData?.deposits || []).reduce((sum, item) => sum + (Number(item.balance) || 0), 0);
  }, [allMembersData]);
  const zeroBalanceCount = useMemo(() => {
    return (allMembersData?.deposits || []).filter((item) => (Number(item.balance) || 0) <= 0).length;
  }, [allMembersData]);

  // Resolve transactions array
  const rawTransactions: DepositTransaction[] = (balanceData?.transactions || balanceData?.history || []) as DepositTransaction[];
  const filteredTransactions = rawTransactions.filter((tx) => {
    if (typeFilter === 'ALL') return true;
    const typeUpper = (tx.type || '').toUpperCase();
    return typeUpper === typeFilter;
  });

  // Calculate current balance value
  const numericBalance = (() => {
    if (!balanceData) return 0;
    const b = balanceData.balance ?? balanceData.currentBalance;
    if (typeof b === 'number') return b;
    if (typeof b === 'string') {
      const parsed = parseFloat(b);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  })();

  const currentViewedMember = members.find((m) => String(m.id) === String(selectedMemberId)) || currentUser;

  // Render unauthenticated view
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-container/40 flex items-center justify-center text-primary mb-4">
          <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Member Deposits & Funds</h2>
        <p className="text-sm text-on-surface-variant max-w-sm mb-6">
          Sign in to view your current deposit balance, transaction deductions, or credit funds.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">account_balance_wallet</span>
            Deposits & Prepaid Funds
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Manage prepaid member pools, view balances, and track automated meal deductions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading || isLoadingAll}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${isLoading || isLoadingAll ? 'animate-spin' : ''}`}>
            sync
          </span>
          Refresh
        </button>
      </div>

      {/* Admin Member Switcher */}
      {isAdmin && members.length > 0 && (
        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[18px]">manage_accounts</span>
            <span>Inspecting Member Balance:</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-outline-variant bg-surface text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={String(currentUser.id)}>My Own Account ({currentUser.name || currentUser.username})</option>
              {members
                .filter((m) => String(m.id) !== String(currentUser.id))
                .map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name || m.username} ({m.status || 'ACTIVE'})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Placement: Toggle right below the Inspecting Member Balance dropdown card */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-surface-container border border-outline-variant/50 shadow-xs">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'single'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Single Member</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('all');
                if (!allMembersData) {
                  fetchAllMembers();
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              <span>All Members</span>
              {totalMembersCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    viewMode === 'all' ? 'bg-white/20 text-on-primary' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {totalMembersCount}
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 px-2">
            {viewMode === 'single' ? (
              <>
                <span className="material-symbols-outlined text-[15px] text-primary">visibility</span>
                <span>Viewing detailed ledger & credit form for selected member</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[15px] text-primary">touch_app</span>
                <span>Click any member row to open their detailed ledger</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ALL MEMBERS VIEW */}
      {viewMode === 'all' ? (
        <div className="space-y-4">
          {/* Summary Strip Above Table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Members */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">groups</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Total Members
                </p>
                <p className="text-xl font-extrabold text-on-surface mt-0.5">
                  {isLoadingAll ? '...' : totalMembersCount}
                </p>
              </div>
            </div>

            {/* Total Pool Balance */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">account_balance</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Total Balance Across Members
                </p>
                <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                  {isLoadingAll ? '...' : fmtCurrency(totalBalanceAll)}
                </p>
              </div>
            </div>

            {/* Count of members with $0 balance */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  zeroBalanceCount > 0
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {zeroBalanceCount > 0 ? 'warning' : 'check_circle'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Members with $0 Balance
                </p>
                <p
                  className={`text-xl font-extrabold mt-0.5 ${
                    zeroBalanceCount > 0 ? 'text-amber-600' : 'text-on-surface'
                  }`}
                >
                  {isLoadingAll ? '...' : `${zeroBalanceCount} ${zeroBalanceCount === 1 ? 'member' : 'members'}`}
                </p>
              </div>
            </div>
          </div>

          {/* All Members Table Card */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden shadow-xs">
            {/* Table Header Controls */}
            <div className="p-4 sm:p-5 border-b border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  All Members Deposit Overview
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Overview of current balances across all household accounts. Click any row to inspect & credit funds.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter by name or username..."
                  value={allSearch}
                  onChange={(e) => setAllSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoadingAll && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3"></div>
                <span className="text-sm font-semibold text-on-surface-variant">
                  Loading all members deposit balances...
                </span>
              </div>
            )}

            {/* Error State */}
            {!isLoadingAll && errorAll && (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">error</span>
                </div>
                <p className="text-sm font-bold text-on-surface mb-1">Could Not Load All Members</p>
                <p className="text-xs text-on-surface-variant max-w-sm mb-4">{errorAll}</p>
                <button
                  type="button"
                  onClick={fetchAllMembers}
                  className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
                >
                  Retry Loading
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingAll && !errorAll && sortedAndFilteredDeposits.length === 0 && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[28px]">search_off</span>
                </div>
                <p className="text-sm font-bold text-on-surface mb-1">No Members Found</p>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  {allSearch ? `No members match "${allSearch}".` : 'No member deposit records available.'}
                </p>
              </div>
            )}

            {/* Table */}
            {!isLoadingAll && !errorAll && sortedAndFilteredDeposits.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high uppercase tracking-wider">
                    <tr>
                      <th
                        className="py-3 px-4 cursor-pointer select-none hover:text-on-surface transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Member</span>
                          <span className="material-symbols-outlined text-[14px]">
                            {sortField === 'name' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 cursor-pointer select-none hover:text-on-surface transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          <span className="material-symbols-outlined text-[14px]">
                            {sortField === 'status' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 cursor-pointer select-none hover:text-on-surface transition-colors text-right"
                        onClick={() => handleSort('balance')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Balance</span>
                          <span className="material-symbols-outlined text-[14px]">
                            {sortField === 'balance' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th
                        className="py-3 px-4 cursor-pointer select-none hover:text-on-surface transition-colors text-right"
                        onClick={() => handleSort('transactions')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Transactions</span>
                          <span className="material-symbols-outlined text-[14px]">
                            {sortField === 'transactions' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                          </span>
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60">
                    {sortedAndFilteredDeposits.map((item) => {
                      const bal = Number(item.balance) || 0;
                      const isPositive = bal > 0;
                      const isZero = bal === 0;

                      const statusUpper = (item.status || 'ACTIVE').toUpperCase();
                      const isActive = statusUpper === 'ACTIVE';
                      const isAway = statusUpper === 'AWAY';

                      const isCurrentSelected = String(item.userId) === String(selectedMemberId);

                      return (
                        <tr
                          key={String(item.userId)}
                          onClick={() => handleSelectMemberFromTable(item)}
                          className={`cursor-pointer hover:bg-surface-container-low/70 active:bg-surface-container transition-colors ${
                            isCurrentSelected ? 'bg-primary/5' : ''
                          }`}
                          title={`Click to select ${item.name} and view single-member detailed ledger`}
                        >
                          {/* Member column (name + username) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {(item.name || item.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-on-surface flex items-center gap-1.5">
                                  <span className="truncate">{item.name || item.username}</span>
                                  {isCurrentSelected && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                      Inspecting
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-on-surface-variant font-mono">
                                  @{item.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status column */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : isAway
                                  ? 'bg-purple-500/10 text-purple-600'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500 animate-pulse' : isAway ? 'bg-purple-500' : 'bg-amber-500'
                                }`}
                              />
                              {item.status || 'ACTIVE'}
                            </span>
                          </td>

                          {/* Balance column */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                            <span
                              className={`text-sm ${
                                isPositive
                                  ? 'text-emerald-600'
                                  : isZero
                                  ? 'text-on-surface-variant'
                                  : 'text-rose-600'
                              }`}
                            >
                              {fmtCurrency(bal)}
                            </span>
                          </td>

                          {/* Transactions column */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap text-on-surface-variant font-semibold">
                            <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono text-xs">
                              {item.totalTransactions ?? 0}
                            </span>
                          </td>

                          {/* Action column */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMemberFromTable(item);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                            >
                              <span>Inspect</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* SINGLE MEMBER DETAILED VIEW */}
          {/* Balance Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-on-primary/80 text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">savings</span>
              Current Available Deposit
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">
              {isLoading ? (
                <span className="animate-pulse opacity-70">$--.--</span>
              ) : (
                fmtCurrency(numericBalance)
              )}
            </div>
            <div className="mt-2 text-xs text-on-primary/85">
              Account for: <span className="font-bold underline">{currentViewedMember?.name || currentViewedMember?.username || 'Member'}</span>
              {currentViewedMember?.role === 'ADMIN' && (
                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">ADMIN</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 text-xs text-on-primary/80">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-xs font-medium">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              {numericBalance > 0 ? 'Good Standing' : numericBalance === 0 ? 'Zero Balance' : 'Overdrawn / Deficit'}
            </div>
            <span className="text-[11px] opacity-75">Used for automated meal cycle settlement deductions</span>
          </div>
        </div>
      </div>

      {/* Admin Add Deposit Form */}
      {isAdmin ? (
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-surface-container-high">
            <div className="w-8 h-8 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_card</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Credit Member Deposit</h2>
              <p className="text-xs text-on-surface-variant">Admin tool to record cash, bank transfers, or prepaid meal funds.</p>
            </div>
          </div>

          <form onSubmit={handleAddDeposit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Member Selection */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Household Member <span className="text-error">*</span>
                </label>
                <select
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name || m.username} ({m.email || `#${m.id}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deposit Amount */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Amount ($) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-11 pl-8 pr-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank transfer, Cash handed in"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !amount}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>Processing Deposit...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    <span>Credit Deposit</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">info</span>
          <div className="text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-on-surface">How deposits work:</span> Your available deposit fund is automatically deducted at the end of each billing cycle when the administrator runs the settlement. Contact your household administrator to add funds to your account.
          </div>
        </div>
      )}

      {/* Transactions History Section */}
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-high">
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">history</span>
              Transaction History
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Record of deposits credited and automated settlement deductions.
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container-low">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({rawTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('DEPOSIT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'DEPOSIT'
                  ? 'bg-surface-container-lowest text-emerald-600 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Deposits
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('DEDUCTION')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'DEDUCTION'
                  ? 'bg-surface-container-lowest text-rose-600 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Deductions
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3"></div>
            <span className="text-sm font-semibold text-on-surface-variant">Loading transaction history...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">error</span>
            </div>
            <p className="text-sm font-bold text-on-surface mb-1">Could Not Load History</p>
            <p className="text-xs text-on-surface-variant max-w-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchBalanceAndHistory}
              className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTransactions.length === 0 && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
            </div>
            <p className="text-sm font-bold text-on-surface mb-1">No Transactions Found</p>
            <p className="text-xs text-on-surface-variant max-w-xs">
              {typeFilter === 'ALL'
                ? 'There are no deposits or meal settlement deductions recorded for this account yet.'
                : `No transactions matching the "${typeFilter}" filter.`}
            </p>
          </div>
        )}

        {/* Transactions Table */}
        {!isLoading && !error && filteredTransactions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Note / Reason</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/60">
                {filteredTransactions.map((tx, idx) => {
                  const isDeposit = (tx.type || '').toUpperCase() === 'DEPOSIT';
                  const dateStr = tx.created_at || tx.createdAt || '';
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  const numericAmount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : (tx.amount || 0);

                  return (
                    <tr key={tx.id || idx} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3.5 px-4 text-on-surface font-medium whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : 'bg-rose-500/10 text-rose-700'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isDeposit ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                          {isDeposit ? 'DEPOSIT' : 'DEDUCTION'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold">
                        <span className={isDeposit ? 'text-emerald-600' : 'text-rose-600'}>
                          {isDeposit ? '+' : '-'} {fmtCurrency(numericAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant max-w-xs truncate">
                        {tx.note || <span className="italic text-outline">No note</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold text-on-surface">
                        {tx.balance_after !== undefined && tx.balance_after !== null
                          ? fmtCurrency(tx.balance_after)
                          : tx.balanceAfter !== undefined && tx.balanceAfter !== null
                          ? fmtCurrency(tx.balanceAfter)
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )}
</div>
);
};
