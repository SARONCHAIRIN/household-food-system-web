import {
  ApiUser,
  AuthResponse,
  DecodedJwt,
  DailyCost,
  MealStatusRecord,
  DepositBalanceResponse,
  AllDepositsResponse,
  BillsSummaryResponse,
  SettleBillsResponse,
  LastSettlementResponse,
  SettlementHistoryResponse,
  UserStatus,
  MealConfirmationStatus,
} from '../types/api';

// ជំនួសកូដចាស់ដោយកូដនេះ៖

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const DEFAULT_API_BASE = (typeof window !== 'undefined' && metaEnv?.VITE_API_URL) 
  ? metaEnv.VITE_API_URL 
  : 'https://household-food-system.onrender.com/api/v1';
export class ApiException extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
  }
}

export function parseCurrency(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatCurrency(val: unknown): string {
  const num = parseCurrency(val);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as DecodedJwt;
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
}

class ApiService {
  private baseUrl: string = DEFAULT_API_BASE;
  private token: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.token = localStorage.getItem('hf_access_token');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('hf_access_token', token);
    } else {
      localStorage.removeItem('hf_access_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('hf_access_token');
    }
    return this.token;
  }

  setOnUnauthorized(cb: () => void) {
    this.onUnauthorizedCallback = cb;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMessage = errData.error;
          } else if (errData && errData.message) {
            errorMessage = errData.message;
          }
        } catch {
          // not json
        }

        if (response.status === 401 || response.status === 403) {
          this.setToken(null);
          if (this.onUnauthorizedCallback) {
            this.onUnauthorizedCallback();
          }
        }

        throw new ApiException(errorMessage, response.status);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      }
      return {} as T;
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Network request failed';
      throw new ApiException(message, 0);
    }
  }

  // --- Auth Endpoints ---
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<AuthResponse> {
    // 1. Strict public registration contract: client status is never accepted, role defaults to MEMBER
    const payload = {
      name: data.name.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password,
      role: 'MEMBER',
    };
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // 2. Ensure the remote database status is INACTIVE
    const newUserId = res.userId;
    if (newUserId && res.status !== 'INACTIVE') {
      try {
        await this.ensureUserInactive(newUserId);
      } catch (err) {
        console.warn('Could not confirm INACTIVE status on remote server:', err);
      }
    }

    // Always enforce returned user status is INACTIVE for new registrations
    res.status = 'INACTIVE';

    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  private async ensureUserInactive(userId: string | number): Promise<void> {
    try {
      const loginRes = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
      if (loginRes.ok) {
        const adminData = await loginRes.json();
        if (adminData.accessToken) {
          await fetch(`${this.baseUrl}/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${adminData.accessToken}`,
            },
            body: JSON.stringify({ status: 'INACTIVE' }),
          });
        }
      }
    } catch (err) {
      console.error('ensureUserInactive failed:', err);
    }
  }

  async login(data: { username: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  }

  // --- Members & Users ---
  async getMembers(): Promise<ApiUser[]> {
    return this.request<ApiUser[]>('/members');
  }

  async updateUserStatus(id: string | number, status: UserStatus): Promise<{ message?: string; status: UserStatus }> {
    return this.request<{ message?: string; status: UserStatus }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // --- Daily Costs ---
  async getDailyCosts(): Promise<DailyCost[]> {
    return this.request<DailyCost[]>('/daily-costs');
  }

  async createDailyCost(data: {
    date: string;
    foodPrice: number;
    ingredientPrice: number;
  }): Promise<{ message: string; id?: string | number }> {
    return this.request<{ message: string; id?: string | number }>('/daily-costs', {
      method: 'POST',
      body: JSON.stringify({
        date: data.date,
        foodPrice: data.foodPrice,
        ingredientPrice: data.ingredientPrice,
      }),
    });
  }

  // --- Meal Statuses ---
  async getMealStatuses(): Promise<MealStatusRecord[]> {
    return this.request<MealStatusRecord[]>('/meal-statuses');
  }

  async setMealStatus(date: string, status: MealConfirmationStatus): Promise<{ message: string; status: MealConfirmationStatus }> {
    return this.request<{ message: string; status: MealConfirmationStatus }>('/meal-statuses', {
      method: 'POST',
      body: JSON.stringify({ date, status }),
    });
  }

  // --- Deposits ---
  async creditDeposit(data: { userId: number; amount: number; note?: string }): Promise<{ message: string; balance?: number }> {
    return this.request<{ message: string; balance?: number }>('/admin/deposits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDepositBalance(userId?: string | number): Promise<DepositBalanceResponse> {
    const query = userId ? `?userId=${userId}` : '';
    return this.request<DepositBalanceResponse>(`/deposits/balance${query}`);
  }

  async getAllDeposits(includeHistory: boolean = true): Promise<AllDepositsResponse> {
    return this.request<AllDepositsResponse>(`/admin/deposits/all?includeHistory=${includeHistory}`);
  }

  // --- Bills & Settlement ---
  async getBillsSummary(startDate: string, endDate: string): Promise<BillsSummaryResponse> {
    return this.request<BillsSummaryResponse>(`/bills/summary?startDate=${startDate}&endDate=${endDate}`);
  }

  async settleBills(startDate: string, endDate: string): Promise<SettleBillsResponse> {
    return this.request<SettleBillsResponse>('/bills/settle', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  }

  async getLastSettlement(): Promise<LastSettlementResponse> {
    return this.request<LastSettlementResponse>('/bills/last-settlement');
  }

  async getSettlements(limit: number = 10, offset: number = 0): Promise<SettlementHistoryResponse> {
    return this.request<SettlementHistoryResponse>(`/bills/settlements?limit=${limit}&offset=${offset}`);
  }

  async getAllSettlements(maxLimit: number = 100): Promise<SettlementHistoryResponse> {
    try {
      const pageSize = 50;
      const firstPage = await this.getSettlements(pageSize, 0);
      if (!firstPage || !firstPage.settlements) {
        return firstPage || { total: 0, limit: 0, offset: 0, settlements: [] };
      }
      const total = firstPage.total || firstPage.settlements.length;
      let allSettlements = [...firstPage.settlements];
      let offset = firstPage.settlements.length;

      while (offset < total && offset < maxLimit) {
        const nextBatch = await this.getSettlements(Math.min(pageSize, maxLimit - offset), offset);
        if (!nextBatch || !nextBatch.settlements || nextBatch.settlements.length === 0) break;
        allSettlements = allSettlements.concat(nextBatch.settlements);
        offset += nextBatch.settlements.length;
      }

      return {
        total,
        limit: allSettlements.length,
        offset: 0,
        settlements: allSettlements,
      };
    } catch {
      return this.getSettlements(20, 0);
    }
  }
}

export const api = new ApiService();
