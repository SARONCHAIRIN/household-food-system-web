import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  ApiUser,
  DailyCost,
  MealStatusRecord,
  DepositBalanceResponse,
  AllDepositsResponse,
  BillsSummaryResponse,
  SettleBillsResponse,
  LastSettlementResponse,
  SettlementHistoryResponse,
  Role,
  UserStatus,
  MealConfirmationStatus,
} from '../types/api';
import { api, decodeJwt, parseCurrency } from '../services/apiClient';
import { DateRange, computeDatePreset, getLocalDateString } from '../services/billingDateUtils';
import { translations, Language } from '../translations';

export type TabType = 'dashboard' | 'meals' | 'deposits' | 'bills' | 'profile';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Navigation & Preferences
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  allowedTabs: TabType[];
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  t: typeof translations['en'];

  // Authentication & Current User
  isAuthenticated: boolean;
  currentUser: ApiUser | null;
  userRole: Role;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { name: string; username: string; email: string; password: string; role?: string }) => Promise<void>;
  logout: () => void;

  // Live Backend Data strictly from endpoints
  members: ApiUser[];
  dailyCosts: DailyCost[];
  mealStatuses: MealStatusRecord[];
  depositBalance: DepositBalanceResponse | null;
  allDeposits: AllDepositsResponse | null;
  selectedBillsRange: DateRange;
  setSelectedBillsRange: (range: DateRange) => void;
  updateSelectedBillsRange: (range: DateRange) => Promise<BillsSummaryResponse | null>;
  billsSummary: BillsSummaryResponse | null;
  billsSummaryLoading: boolean;
  billsSummaryError: string | null;
  fetchBillsSummary: (range?: DateRange) => Promise<BillsSummaryResponse | null>;
  lastSettlement: LastSettlementResponse | null;
  setLastSettlement: React.Dispatch<React.SetStateAction<LastSettlementResponse | null>>;
  settlementHistory: SettlementHistoryResponse | null;
  loading: boolean;
  error: string | null;
  refreshAllData: () => Promise<void>;

  // Actions wired directly to endpoints
  toggleMealStatus: (date: string, status: MealConfirmationStatus) => Promise<void>;
  addDailyExpense: (foodPrice: number, ingredientPrice: number, date?: string) => Promise<void>;
  creditMemberDeposit: (userId: number, amount: number, note?: string) => Promise<void>;
  updateMemberStatus: (userId: string | number, status: UserStatus) => Promise<void>;
  settleCycleBills: (startDate: string, endDate: string) => Promise<SettleBillsResponse>;

  // Feedback
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTabState, setCurrentTabState] = useState<TabType>('dashboard');
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('hf_lang') as Language;
      if (saved === 'en' || saved === 'km') return saved;
      if (
        typeof navigator !== 'undefined' &&
        navigator.language &&
        navigator.language.toLowerCase().startsWith('km')
      ) {
        return 'km';
      }
    } catch {
      // fallback
    }
    return 'en';
  });
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!api.getToken();
  });

  const [currentUser, setCurrentUser] = useState<ApiUser | null>(() => {
    const token = api.getToken();
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        return {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          name: decoded.username,
          email: `${decoded.username}@household.local`,
          status: 'ACTIVE',
        };
      }
    }
    return null;
  });

  const [userRole, setUserRole] = useState<Role>(() => {
    const token = api.getToken();
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded?.role) return decoded.role;
    }
    return 'USER';
  });

  // Allowed tabs: ADMIN gets 5 tabs; MEMBER/USER gets ONLY 3 tabs (Dashboard, Meals, Profile)
  const allowedTabs: TabType[] = userRole === 'ADMIN'
    ? ['dashboard', 'meals', 'deposits', 'bills', 'profile']
    : ['dashboard', 'meals', 'profile'];

  const setCurrentTab = useCallback((tab: TabType) => {
    if (userRole !== 'ADMIN' && (tab === 'deposits' || tab === 'bills')) {
      setCurrentTabState('dashboard');
      return;
    }
    setCurrentTabState(tab);
  }, [userRole]);

  // Role Gate: if role changes or if current tab is forbidden for non-admin, redirect to dashboard
  useEffect(() => {
    if (userRole !== 'ADMIN' && (currentTabState === 'deposits' || currentTabState === 'bills')) {
      setCurrentTabState('dashboard');
    }
  }, [userRole, currentTabState]);

  const currentTab = currentTabState;

  // Live data strictly from API responses
  const [members, setMembers] = useState<ApiUser[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [mealStatuses, setMealStatuses] = useState<MealStatusRecord[]>([]);
  const [depositBalance, setDepositBalance] = useState<DepositBalanceResponse | null>(null);
  const [allDeposits, setAllDeposits] = useState<AllDepositsResponse | null>(null);

  // Single source of truth for settlement cycle date range
  const [selectedBillsRange, setSelectedBillsRangeState] = useState<DateRange>(() =>
    computeDatePreset('this_month')
  );
  const selectedBillsRangeRef = useRef<DateRange>(selectedBillsRange);
  selectedBillsRangeRef.current = selectedBillsRange;

  const [billsSummary, setBillsSummary] = useState<BillsSummaryResponse | null>(null);
  const [billsSummaryLoading, setBillsSummaryLoading] = useState<boolean>(false);
  const [billsSummaryError, setBillsSummaryError] = useState<string | null>(null);
  const billsFetchSeqRef = useRef<number>(0);

  const [lastSettlement, setLastSettlement] = useState<LastSettlementResponse | null>(null);
  const [settlementHistory, setSettlementHistory] = useState<SettlementHistoryResponse | null>(null);

  const fetchBillsSummary = useCallback(
    async (range?: DateRange): Promise<BillsSummaryResponse | null> => {
      const targetRange = range || selectedBillsRangeRef.current;
      if (!targetRange.startDate || !targetRange.endDate) {
        return null;
      }
      const seq = ++billsFetchSeqRef.current;
      setBillsSummaryLoading(true);
      setBillsSummaryError(null);
      try {
        const data = await api.getBillsSummary(targetRange.startDate, targetRange.endDate);
        if (seq === billsFetchSeqRef.current) {
          setBillsSummary(data);
        }
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch bills summary';
        if (seq === billsFetchSeqRef.current) {
          setBillsSummaryError(msg);
          setBillsSummary(null);
        }
        return null;
      } finally {
        if (seq === billsFetchSeqRef.current) {
          setBillsSummaryLoading(false);
        }
      }
    },
    []
  );

  const updateSelectedBillsRange = useCallback(
    (range: DateRange) => {
      setSelectedBillsRangeState(range);
      selectedBillsRangeRef.current = range;
      // Immediately invalidate old preview to ensure NO stale numbers are shown next to the changed date
      setBillsSummary(null);
      setBillsSummaryLoading(true);
      setBillsSummaryError(null);
      return fetchBillsSummary(range);
    },
    [fetchBillsSummary]
  );

  const setSelectedBillsRange = useCallback(
    (range: DateRange) => {
      updateSelectedBillsRange(range);
    },
    [updateSelectedBillsRange]
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hf_lang', lang);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('hf_theme', next);
      return next;
    });
  };

  // Wire 401/403 unauthorized callback
  useEffect(() => {
    api.setOnUnauthorized(() => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      showToast('Authentication failed or token expired. Please sign in.', 'error');
    });
  }, [showToast]);

  // Load language and theme from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('hf_lang') as Language;
    if (savedLang) setLanguageState(savedLang);

    const savedTheme = localStorage.getItem('hf_theme') as 'light' | 'dark';
    if (savedTheme) {
      setThemeState(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    if (!api.getToken()) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. GET /members
      const membersData = await api.getMembers().catch((err) => {
        console.error('GET /members failed:', err.message);
        return [];
      });
      setMembers(membersData);

      // Match current authenticated user in members list
      const token = api.getToken();
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded) {
          const matched = membersData.find(
            (m) => String(m.id) === String(decoded.id) || m.username === decoded.username
          );
          if (matched) {
            setCurrentUser(matched);
            setUserRole(matched.role);
          }
        }
      }

      // 2. GET /daily-costs
      const costsData = await api.getDailyCosts().catch((err) => {
        console.error('GET /daily-costs failed:', err.message);
        return [];
      });
      setDailyCosts(costsData);

      // 3. GET /meal-statuses
      const statusesData = await api.getMealStatuses().catch((err) => {
        console.error('GET /meal-statuses failed:', err.message);
        return [];
      });
      setMealStatuses(statusesData);

      // 4. GET /deposits/balance?userId=<id>
      const tokenDecoded = token ? decodeJwt(token) : null;
      const uid = tokenDecoded?.id || currentUser?.id;
      if (uid) {
        const balanceData = await api.getDepositBalance(uid).catch((err) => {
          console.error('GET /deposits/balance failed:', err.message);
          return null;
        });
        setDepositBalance(balanceData);
      }

      // 5. Admin endpoints
      const role = tokenDecoded?.role || userRole;
      if (role === 'ADMIN') {
        // GET /admin/deposits/all?includeHistory=true
        const allDep = await api.getAllDeposits(true).catch((err) => {
          console.error('GET /admin/deposits/all failed:', err.message);
          return null;
        });
        setAllDeposits(allDep);

        // GET /bills/summary?startDate=&endDate= using selectedBillsRange (Single Source of Truth)
        const activeRange = selectedBillsRangeRef.current;
        const billsData = await api.getBillsSummary(activeRange.startDate, activeRange.endDate).catch((err) => {
          console.error('GET /bills/summary failed:', err.message);
          return null;
        });
        setBillsSummary(billsData);

        // GET /bills/last-settlement
        const lastSet = await api.getLastSettlement().catch((err) => {
          console.error('GET /bills/last-settlement failed:', err.message);
          return null;
        });
        setLastSettlement(lastSet);

        // GET /bills/settlements (paginated to cover comprehensive recent history)
        const hist = await api.getAllSettlements(100).catch((err) => {
          console.error('GET /bills/settlements failed:', err.message);
          return null;
        });
        setSettlementHistory(hist);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'API Request Failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, userRole, showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated, refreshAllData]);

  // Auth Operations
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ username, password });
      setIsAuthenticated(true);
      if (res.accessToken) {
        const decoded = decodeJwt(res.accessToken);
        if (decoded) {
          setUserRole(decoded.role);
          setCurrentUser({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
            name: decoded.username,
            email: `${decoded.username}@household.local`,
            status: 'ACTIVE',
          });
        }
      }
      showToast('Signed in successfully!', 'success');
      await refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.register(data);
      setIsAuthenticated(true);
      if (res.accessToken) {
        const decoded = decodeJwt(res.accessToken);
        if (decoded) {
          setUserRole(decoded.role);
        }
      }
      showToast('Account registered successfully!', 'success');
      await refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMembers([]);
    setDailyCosts([]);
    setMealStatuses([]);
    setDepositBalance(null);
    setAllDeposits(null);
    setBillsSummary(null);
    setLastSettlement(null);
    setSettlementHistory(null);
    showToast('Signed out', 'info');
  };

  // POST /meal-statuses  body: { date, status }
  const toggleMealStatus = async (date: string, status: MealConfirmationStatus) => {
    try {
      await api.setMealStatus(date, status);
      showToast(`Meal status set to ${status}`, 'success');
      await refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update meal status';
      showToast(msg, 'error');
      throw err;
    }
  };

  // POST /daily-costs  body: { date, foodPrice, ingredientPrice }
  const addDailyExpense = async (foodPrice: number, ingredientPrice: number, explicitDate?: string) => {
    const costDate = explicitDate || getLocalDateString(new Date());
    try {
      await api.createDailyCost({
        date: costDate,
        foodPrice,
        ingredientPrice,
      });
      showToast(`Daily cost recorded for ${costDate} ($${(foodPrice + ingredientPrice).toFixed(2)})`, 'success');
      await refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log daily cost';
      showToast(msg, 'error');
      throw err;
    }
  };

  // POST /admin/deposits  body: { userId, amount, note? }
  const creditMemberDeposit = async (userId: number, amount: number, note?: string) => {
    try {
      await api.creditDeposit({ userId, amount, note });
      showToast(`Deposited $${amount.toFixed(2)} to member #${userId}`, 'success');
      await refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to credit deposit';
      showToast(msg, 'error');
      throw err;
    }
  };

  // PATCH /users/:id/status  body: { status }
  const updateMemberStatus = async (userId: string | number, status: UserStatus) => {
    try {
      await api.updateUserStatus(userId, status);
      const msg = language === 'km'
        ? (status === 'ACTIVE' ? 'ស្ថានភាពត្រូវបានកែប្រែទៅជាសកម្ម' : 'ស្ថានភាពត្រូវបានកែប្រែទៅជានៅក្រៅ')
        : (status === 'ACTIVE' ? 'Status updated to Active' : 'Status updated to Away');
      showToast(msg, 'success');
      await refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (language === 'km' ? 'បរាជ័យក្នុងការកែប្រែស្ថានភាព' : 'Failed to update status');
      showToast(msg, 'error');
      throw err;
    }
  };

  // POST /bills/settle  body: { startDate, endDate }
  const settleCycleBills = async (startDate: string, endDate: string) => {
    try {
      // Capture preview totals from current billsSummary to guarantee zero mismatch with Last Settlement Record
      const currentMemberDueSum = billsSummary?.memberSummaries?.reduce(
        (acc, m) => acc + parseCurrency(m.totalDue),
        0
      ) ?? 0;
      const currentPoolFood = parseCurrency(billsSummary?.poolSummary?.totalFoodPrice ?? 0);
      const currentPoolIngr = parseCurrency(billsSummary?.poolSummary?.totalIngredientPrice ?? 0);
      const confirmedTotal = currentMemberDueSum > 0 ? currentMemberDueSum : (currentPoolFood + currentPoolIngr);

      const res = await api.settleBills(startDate, endDate);
      showToast(`Settled cycle. ${res.results?.length ?? 0} balances adjusted.`, 'success');

      // 1. Immediately refetch GET /bills/last-settlement
      const lastSet = await api.getLastSettlement().catch(() => null);
      const isMatching =
        lastSet &&
        (lastSet.start_date === startDate || lastSet.startDate === startDate) &&
        (lastSet.end_date === endDate || lastSet.endDate === endDate);

      if (isMatching && lastSet) {
        setLastSettlement(lastSet);
      } else {
        // Enforce immediate update with exact date range, total, and results from this confirmed cycle
        setLastSettlement({
          id: lastSet?.id || Date.now(),
          start_date: startDate,
          startDate: startDate,
          end_date: endDate,
          endDate: endDate,
          settled_by_name: currentUser?.name || currentUser?.username || 'Admin',
          settledByName: currentUser?.name || currentUser?.username || 'Admin',
          total_due_all: confirmedTotal,
          totalDueAll: confirmedTotal,
          total_food_cost: currentPoolFood,
          totalFoodCost: currentPoolFood,
          total_ingredient_cost: currentPoolIngr,
          totalIngredientCost: currentPoolIngr,
          results: res.results,
          created_at: new Date().toISOString(),
        });
      }

      // 2. Refresh deposits and settlement history in parallel
      const [hist, allDep] = await Promise.all([
        api.getAllSettlements(100).catch(() => null),
        api.getAllDeposits(true).catch(() => null),
      ]);
      if (hist) setSettlementHistory(hist);
      if (allDep) setAllDeposits(allDep);

      // 3. Refresh bills summary for this exact range
      await fetchBillsSummary({ startDate, endDate });

      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Settlement failed';
      showToast(msg, 'error');
      throw err;
    }
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        allowedTabs,
        language,
        setLanguage,
        theme,
        toggleTheme,
        t,
        isAuthenticated,
        currentUser,
        userRole,
        login,
        register,
        logout,
        members,
        dailyCosts,
        mealStatuses,
        depositBalance,
        allDeposits,
        selectedBillsRange,
        setSelectedBillsRange,
        updateSelectedBillsRange,
        billsSummary,
        billsSummaryLoading,
        billsSummaryError,
        fetchBillsSummary,
        lastSettlement,
        setLastSettlement,
        settlementHistory,
        loading,
        error,
        refreshAllData,
        toggleMealStatus,
        addDailyExpense,
        creditMemberDeposit,
        updateMemberStatus,
        settleCycleBills,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
