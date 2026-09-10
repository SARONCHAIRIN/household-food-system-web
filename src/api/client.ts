/**
 * Typed API Client for Household Food System
 */

import {
  ApiUser,
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
  DailyCostRecord,
  CreateDailyCostPayload,
  MealStatusRecord,
  SetMealStatusPayload,
  BillsSummaryResponse,
  DepositBalanceResponse,
  CreateDepositPayload,
  AdminAllDepositsResponse,
  SettleBillsPayload,
  SettleBillsResponse,
  LastSettlementResponse,
  SettlementsListResponse,
} from './types';

export const LIVE_API_URL = 'https://household-food-system.onrender.com/api/v1';
export const LOCAL_API_URL = 'http://localhost:10000/api/v1';

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('hfs_custom_api_url');
    if (custom) return custom.replace(/\/+$/, '');

    // In an HTTPS preview or deployed environment, browsers block http://localhost requests
    // with "TypeError: Load failed" due to Mixed Content security rules.
    // Default to HTTPS live cloud endpoint if the page origin is HTTPS.
    if (window.location.protocol === 'https:') {
      return (((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || LIVE_API_URL) as string).replace(/\/+$/, '');
    }
  }
  return (((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || LOCAL_API_URL) as string).replace(/\/+$/, '');
}

export function setCustomBaseUrl(url: string | null) {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem('hfs_custom_api_url', url.trim());
    } else {
      localStorage.removeItem('hfs_custom_api_url');
    }
  }
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'hfs_access_token',
  REFRESH_TOKEN: 'hfs_refresh_token',
  USER_DATA: 'hfs_user_data',
};

// Listeners for 401 unauthorized events
type AuthListener = () => void;
const authListeners: Set<AuthListener> = new Set();

export function onUnauthorized(callback: AuthListener): () => void {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

function notifyUnauthorized() {
  clearTokens();
  authListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

// Token management
export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
}

export function getStoredUser(): ApiUser | null {
  const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  return null;
}

export function setStoredUser(user: ApiUser) {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
}

// Helper to decode JWT payload safely
export function parseJwtPayload(token: string): { id?: string; username?: string; role?: 'ADMIN' | 'MEMBER' | 'USER' } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Failed to parse JWT payload', e);
    return null;
  }
}

// Core Fetch Wrapper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    // If the request threw "Load failed" or "Failed to fetch" (e.g. Mixed Content blocking http://localhost or offline),
    // attempt automatic fallback to the alternative server
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const fallbackBaseUrl = isLocal ? LIVE_API_URL : LOCAL_API_URL;

    if (baseUrl !== fallbackBaseUrl) {
      try {
        console.warn(`Fetch to ${url} failed (${networkError.message}). Attempting fallback to ${fallbackBaseUrl}...`);
        const fallbackUrl = `${fallbackBaseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        response = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
        // Succeeded on fallback! Persist so following requests use the working backend
        setCustomBaseUrl(fallbackBaseUrl);
      } catch (fallbackError: any) {
        const err = new Error(`Cannot reach API at ${baseUrl} or fallback ${fallbackBaseUrl}: ${networkError.message || fallbackError.message || 'Load failed'}`) as Error & { status?: number };
        throw err;
      }
    } else {
      const err = new Error(`Cannot connect to ${url}: ${networkError.message || 'Load failed'}`) as Error & { status?: number };
      throw err;
    }
  }

  // Handle 401 and 403 Unauthorized
  if (response.status === 401 || response.status === 403) {
    let errorMsg = response.status === 403 ? 'Access forbidden or session expired' : 'Unauthorized: Please log in';
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore
    }
    notifyUnauthorized();
    const err = new Error(errorMsg) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  // Handle errors
  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore
    }
    const err = new Error(errorMsg) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  // Handle empty responses (like 204 or empty text)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// API Endpoints object
export const api = {
  auth: {
    async login(payload: LoginPayload): Promise<LoginResponse> {
      const res = await request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTokens(res.accessToken, res.refreshToken);

      // Extract user info from token payload or members list
      const claims = parseJwtPayload(res.accessToken);
      if (claims) {
        const stored = getStoredUser();
        const user: ApiUser = {
          id: claims.id || stored?.id || '2',
          name: stored?.name || claims.username || payload.username,
          username: claims.username || payload.username,
          email: stored?.email || `${claims.username || payload.username}@household.com`,
          role: claims.role || 'MEMBER',
          status: 'ACTIVE',
        };
        setStoredUser(user);
      }

      return res;
    },

    async register(payload: RegisterPayload): Promise<RegisterResponse> {
      const res = await request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.accessToken) {
        setTokens(res.accessToken, res.refreshToken);
        const user: ApiUser = {
          id: res.userId || res.id || '1',
          name: res.name || payload.name,
          username: res.username || payload.username,
          email: res.email || payload.email,
          role: res.role || payload.role || 'MEMBER',
          status: res.status || 'ACTIVE',
        };
        setStoredUser(user);
      }

      return res;
    },

    logout() {
      clearTokens();
    },

    getCurrentUser(): ApiUser | null {
      return getStoredUser();
    },

    isAuthenticated(): boolean {
      return Boolean(getAccessToken());
    },
  },

  onUnauthorized,

  members: {
    async getAll(): Promise<ApiUser[]> {
      return request<ApiUser[]>('/members');
    },
  },

  users: {
    async updateStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'AWAY'): Promise<{ message: string; user?: ApiUser }> {
      return request<{ message: string; user?: ApiUser }>(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
  },

  deposits: {
    async create(payload: CreateDepositPayload): Promise<any> {
      return request<any>('/admin/deposits', {
        method: 'POST',
        body: JSON.stringify({
          userId: Number(payload.userId),
          amount: Number(payload.amount),
          note: payload.note ? payload.note.trim() : undefined,
        }),
      });
    },

    async getBalance(userId?: number | string): Promise<DepositBalanceResponse> {
      const query = userId !== undefined && userId !== null && userId !== '' ? `?userId=${userId}` : '';
      return request<DepositBalanceResponse>(`/deposits/balance${query}`);
    },

    async getAllMembers(includeHistory: boolean = false): Promise<AdminAllDepositsResponse> {
      return request<AdminAllDepositsResponse>(`/admin/deposits/all?includeHistory=${includeHistory}`);
    },
  },

  dailyCosts: {
    async getAll(): Promise<DailyCostRecord[]> {
      return request<DailyCostRecord[]>('/daily-costs');
    },

    async create(payload: CreateDailyCostPayload): Promise<DailyCostRecord> {
      return request<DailyCostRecord>('/daily-costs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  mealStatuses: {
    async getAll(): Promise<MealStatusRecord[]> {
      return request<MealStatusRecord[]>('/meal-statuses');
    },

    async setStatus(payload: SetMealStatusPayload): Promise<{ message: string }> {
      return request<{ message: string }>('/meal-statuses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  bills: {
    async getSummary(params: { startDate: string; endDate: string }): Promise<BillsSummaryResponse> {
      const query = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
      }).toString();
      return request<BillsSummaryResponse>(`/bills/summary?${query}`);
    },

    async settle(payload: SettleBillsPayload): Promise<SettleBillsResponse> {
      return request<SettleBillsResponse>('/bills/settle', {
        method: 'POST',
        body: JSON.stringify({
          startDate: payload.startDate,
          endDate: payload.endDate,
        }),
      });
    },

    async getLastSettlement(): Promise<LastSettlementResponse> {
      return request<LastSettlementResponse>('/bills/last-settlement');
    },

    async getSettlements(params?: { limit?: number; offset?: number }): Promise<SettlementsListResponse> {
      const limit = params?.limit ?? 10;
      const offset = params?.offset ?? 0;
      return request<SettlementsListResponse>(`/bills/settlements?limit=${limit}&offset=${offset}`);
    },
  },
};
