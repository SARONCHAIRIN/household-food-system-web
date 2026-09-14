import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, parseCurrency } from '../services/apiClient';

export const DepositsScreen: React.FC = () => {
  const {
    currentUser,
    userRole,
    depositBalance,
    allDeposits,
    members,
    creditMemberDeposit,
    language,
    t,
    showToast,
  } = useApp();

  // Multi-Currency Input State for POST /admin/deposits
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id ? String(currentUser.id) : (members[0] ? String(members[0].id) : '14')
  );
  const [amount, setAmount] = useState<string>('80000');
  const [currency, setCurrency] = useState<'KHR' | 'USD'>('KHR');
  const [exchangeRate, setExchangeRate] = useState<number>(4000);
  const [note, setNote] = useState<string>('Prepaid pantry top-up');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Derive my balance from GET /deposits/balance or allDeposits
  const myBalanceKHR = depositBalance
    ? parseCurrency(depositBalance.balance)
    : allDeposits?.deposits?.find(
      (d) => String(d.userId) === String(currentUser?.id)
    )?.balance ?? 0;

  const myBalanceUSD = Number((myBalanceKHR / exchangeRate).toFixed(2));
  const myHistory = depositBalance?.history || [];

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast(
        language === 'km' ? 'សូមបញ្ចូលចំនួនប្រាក់តម្កល់ត្រឹមត្រូវ' : 'Please enter a valid deposit amount',
        'error'
      );
      return;
    }
    const uid = parseInt(selectedUserId, 10);
    if (!uid) {
      showToast(
        language === 'km' ? 'សូមជ្រើសរើសសមាជិកត្រឹមត្រូវ' : 'Please select a valid member',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      // Pass currency and exchange rate to API client service helper
      await creditMemberDeposit(uid, numAmount, currency, exchangeRate, note.trim() || undefined);
      setAmount(currency === 'KHR' ? '80000' : '20.00');
      setNote('');
      showToast(
        language === 'km' ? 'បានបញ្ចូលប្រាក់តម្កល់ជោគជ័យ' : 'Deposit credited successfully',
        'success'
      );
    } catch {
      // handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-28 min-[600px]:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
        <div className="flex flex-col space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[var(--on-surface)] tracking-tight">
              {t.prepaidVault}
            </h1>
            <span className="font-normal text-xs text-[var(--on-surface-variant)] hidden sm:inline">
              / {t.prepaidVaultKh}
            </span>
          </div>
          <p className="text-xs text-[var(--on-surface-variant)]">
            {t.depositsSubtitle}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold shadow-xs w-fit">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
          GET /api/v1/deposits/balance (KHR & USD)
        </span>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Wallet Hero & Admin Multi-Currency Top-up */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* User Dual-Currency Wallet Hero Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#004f35] via-[#006948] to-[#004f35] text-white p-5 shadow-lg border border-white/10">
            <div className="relative z-10 flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#9ff4ca]">
                    {currentUser?.name || 'My Wallet'} (UID #{currentUser?.id})
                  </span>
                  <span className="text-xs text-[#9ff4ca]/80">
                    {currentUser?.username ? `@${currentUser.username}` : ''}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  {depositBalance?.totalTransactions ?? myHistory.length} {t.records}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {Math.round(myBalanceKHR).toLocaleString()} ៛
                  </span>
                  <span className="text-lg font-bold text-[#9ff4ca]">
                    (${myBalanceUSD})
                  </span>
                </div>
                <p className="text-xs text-[#9ff4ca]/80 mt-1">
                  {t.activePrepaidBalance} · Exchange Rate: 1 USD = {exchangeRate.toLocaleString()} KHR
                </p>
              </div>
            </div>
          </div>

          {/* Admin Deposit Form (POST /admin/deposits with Currency Support) */}
          {userRole === 'ADMIN' ? (
            <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)]">
                  <span className="material-symbols-outlined text-[20px]">add_card</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--on-surface)]">
                    {t.creditMemberDeposit}
                  </h3>
                  <p className="text-[11px] text-[var(--on-surface-variant)]">
                    POST /api/v1/admin/deposits
                  </p>
                </div>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-3.5">
                {/* Resident Member Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1">
                    {t.selectResidentMember}
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container)] text-xs font-bold text-[var(--on-surface)] outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (@{m.username}) - #{m.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Currency Switcher & Amount Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[var(--on-surface-variant)]">
                      Deposit Amount
                    </label>

                    {/* Currency Toggle */}
                    <div className="flex bg-[var(--surface-container)] p-0.5 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrency('KHR');
                          setAmount('80000');
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${currency === 'KHR'
                            ? 'bg-[var(--primary)] text-white shadow-xs'
                            : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                          }`}
                      >
                        KHR (៛)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrency('USD');
                          setAmount('20.00');
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${currency === 'USD'
                            ? 'bg-[var(--primary)] text-white shadow-xs'
                            : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                          }`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    step={currency === 'KHR' ? '500' : '1'}
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={currency === 'KHR' ? '80000' : '20.00'}
                    className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container)] text-xs font-bold text-[var(--on-surface)] outline-none"
                  />

                  {/* Dynamic Presets depending on Currency */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {currency === 'KHR'
                      ? ['20000', '40000', '80000', '200000'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(val)}
                          className={`min-h-[40px] rounded-xl text-[11px] font-bold transition-all ${amount === val
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                            }`}
                        >
                          +{(parseInt(val, 10) / 1000)}k ៛
                        </button>
                      ))
                      : ['10', '20', '50', '100'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(val)}
                          className={`min-h-[40px] rounded-xl text-[11px] font-bold transition-all ${amount === val
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'
                            }`}
                        >
                          +${val}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--on-surface-variant)] mb-1">
                    {t.auditNoteOptional}
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={language === 'km' ? 'ផ្ទេរតាម Bakong / វេរប្រាក់ / បង់សាច់ប្រាក់' : 'Bakong transfer / cash deposit'}
                    className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[var(--surface-container)] text-xs text-[var(--on-surface)] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[48px] rounded-full bg-[var(--primary)] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[var(--primary)]/90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  )}
                  <span>
                    {submitting ? t.loading : t.creditDepositToMember}
                  </span>
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {/* Right Column: All Member Balances & Personal History */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* All Member Balances */}
          {userRole === 'ADMIN' && allDeposits && (
            <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-[var(--on-surface)]">
                    {t.allHouseholdDeposits}
                  </h3>
                  <span className="text-xs text-[var(--on-surface-variant)]">
                    GET /api/v1/admin/deposits/all ({allDeposits.totalMembers ?? allDeposits.deposits?.length} {language === 'km' ? 'គណនី' : 'balances'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-[var(--primary)] block">
                    {t.total}: {Math.round(allDeposits.totalPoolBalance ?? 0).toLocaleString()} ៛
                  </span>
                  <span className="text-[10px] text-[var(--on-surface-variant)] font-bold">
                    (${((allDeposits.totalPoolBalance ?? 0) / exchangeRate).toFixed(2)})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allDeposits.deposits?.map((dep) => {
                  const balKHR = parseCurrency(dep.balance);
                  const balUSD = (balKHR / exchangeRate).toFixed(2);
                  const isCurrent = String(dep.userId) === String(currentUser?.id);

                  return (
                    <div
                      key={dep.userId}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 min-w-[40px] rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center font-bold text-xs text-[var(--on-surface)] flex-shrink-0">
                          {dep.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-[var(--on-surface)] truncate">
                            {dep.name} {isCurrent && ` ${t.you}`}
                          </span>
                          <span className="text-[11px] text-[var(--on-surface-variant)] truncate">
                            @{dep.username} · #{dep.userId}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="font-extrabold text-xs sm:text-sm text-[var(--on-surface)] block">
                          {Math.round(balKHR).toLocaleString()} ៛
                        </span>
                        <span className="text-[10px] text-[var(--on-surface-variant)] font-semibold block">
                          (${balUSD})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personal Transaction History */}
          <div className="rounded-3xl bg-[var(--surface-container-lowest)] p-5 shadow-sm border border-[var(--outline)]/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[var(--on-surface)]">
                  {t.myDepositActivity}
                </h3>
                <span className="text-xs text-[var(--on-surface-variant)]">
                  {t.liveEntriesFromApi}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[var(--surface-container)] text-[var(--on-surface)] text-xs font-bold">
                {myHistory.length} {t.records}
              </span>
            </div>

            {myHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--on-surface-variant)]">
                {t.noTransactionRecords}
              </div>
            ) : (
              <div className="space-y-2.5">
                {myHistory.map((h, i) => {
                  const amtKHR = parseCurrency(h.amount);
                  const amtUSD = (amtKHR / exchangeRate).toFixed(2);
                  const isTopup = h.type === 'TOP_UP' || h.type === 'DEPOSIT' || amtKHR >= 0;

                  return (
                    <div
                      key={h.id || i}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline)]/10 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${isTopup
                              ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                              : 'bg-[var(--error)]/15 text-[var(--error)]'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isTopup ? 'south_west' : 'north_east'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-[var(--on-surface)] truncate">
                            {h.note || (isTopup ? t.depositCredit : t.cycleSettlement)}
                          </span>
                          <span className="text-[11px] text-[var(--on-surface-variant)]">
                            {h.created_at ? h.created_at.split('T')[0] : t.recorded}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className={`font-extrabold text-xs sm:text-sm block ${isTopup ? 'text-[var(--primary)]' : 'text-[var(--error)]'
                            }`}
                        >
                          {isTopup ? '+' : '-'}
                          {Math.round(Math.abs(amtKHR)).toLocaleString()} ៛
                        </span>
                        <span className="text-[10px] text-[var(--on-surface-variant)] font-semibold block">
                          ({isTopup ? '+' : '-'}${Math.abs(Number(amtUSD)).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};