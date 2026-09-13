/**
 * API Type Definitions for Household Food System
 */

export interface ApiUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'AWAY';
  joined_at?: string;
  inactive_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ApiMember = ApiUser;

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'MEMBER' | 'USER';
}

export interface RegisterResponse {
  message: string;
  userId?: string;
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: 'ADMIN' | 'MEMBER' | 'USER';
  status?: 'ACTIVE' | 'INACTIVE';
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

export interface DailyCostRecord {
  id: string;
  date: string; // ISO string e.g. "2026-09-09T00:00:00.000Z" or "YYYY-MM-DD"
  food_price?: string;
  foodPrice?: number | string;
  ingredient_price?: string;
  ingredientPrice?: number | string;
  eat_count?: number;
  eatCount?: number;
  total_member_count?: number;
  totalMemberCount?: number;
  cost_food_per_person?: string | null;
  cost_ingredient_per_person?: string | null;
  calculation_status?: string;
  confirmed_at?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDailyCostPayload {
  date: string; // "YYYY-MM-DD"
  foodPrice: number;
  ingredientPrice: number;
  eatCount?: number;
  totalMemberCount?: number;
}

export type ConfirmationType = 'AUTO' | 'MANUAL';

export interface MealStatusRecord {
  id: string;
  member_id?: string;
  memberId?: string;
  date: string; // ISO string e.g. "2026-09-09T00:00:00.000Z"
  status: 'EAT' | 'NOT_EAT';
  confirmation_type?: ConfirmationType | string;
  confirmationType?: ConfirmationType | string;
  confirmed_at?: string;
  cost_food?: string | null;
  cost_ingredient?: string | null;
  cost_total?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function getMealConfirmationType(record?: MealStatusRecord | null): ConfirmationType | null {
  if (!record) return null;
  const raw = String(record.confirmation_type || record.confirmationType || '').toUpperCase().trim();
  if (raw === 'AUTO') return 'AUTO';
  if (raw === 'MANUAL') return 'MANUAL';
  return null;
}

export interface SetMealStatusPayload {
  date: string; // "YYYY-MM-DD"
  status: 'EAT' | 'NOT_EAT';
}

export interface MemberBillSummary {
  memberId: string;
  name: string;
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'AWAY';
  daysEaten: number;
  foodCost: string | number;
  ingredientCost: string | number;
  totalDue: string | number;
}

export interface BillsSummaryResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  totalMembers: number;
  activeMembersCount: number;
  poolSummary: {
    totalFoodPrice: string | number;
    totalIngredientPrice: string | number;
  };
  memberSummaries: MemberBillSummary[];
}

export interface ApiError {
  error: string;
  status?: number;
}

// === DEPOSITS TYPES ===
export interface DepositTransaction {
  id?: string | number;
  userId?: number | string;
  user_id?: number | string;
  type: 'DEPOSIT' | 'DEDUCTION' | string;
  amount: number | string;
  note?: string | null;
  created_at?: string;
  createdAt?: string;
  balance_after?: number | string;
  balanceAfter?: number | string;
}

export interface DepositBalanceResponse {
  balance?: number | string;
  currentBalance?: number | string;
  userId?: number | string;
  userName?: string;
  transactions?: DepositTransaction[];
  history?: DepositTransaction[];
}

export interface CreateDepositPayload {
  userId: number;
  amount: number;
  note?: string;
}

export interface AdminMemberDepositOverview {
  userId: string | number;
  name: string;
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'AWAY' | string;
  balance: number;
  totalTransactions: number;
}

export interface AdminAllDepositsResponse {
  totalMembers: number;
  deposits: AdminMemberDepositOverview[];
}

// === BILL SETTLEMENT TYPES ===
export interface SettleBillResultItem {
  userId: number | string;
  name: string;
  totalDue: number | string;
  previousDepositBalance?: number | string;
  deductedAmount?: number | string;
  settlementStatus: 'SUCCESSFULLY_DEDUCTED' | 'INSUFFICIENT_DEPOSIT_PARTIAL_OR_DEBT' | string;
}

export interface SettleBillsPayload {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface SettleBillsResponse {
  message: string;
  period?: {
    startDate: string;
    endDate: string;
  };
  results: SettleBillResultItem[];
}

export interface LastSettlementResponse {
  id?: string | number;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  settledByName?: string;
  settled_by_name?: string;
  totalFoodCost?: number | string;
  total_food_cost?: number | string;
  totalIngredientCost?: number | string;
  total_ingredient_cost?: number | string;
  totalDueAll?: number | string;
  total_due_all?: number | string;
  createdAt?: string;
  created_at?: string;
  results?: SettleBillResultItem[];
}

export interface SettlementSummaryItem {
  id: string | number;
  start_date: string;
  end_date: string;
  settled_by_name?: string;
  total_food_cost?: number | string;
  total_ingredient_cost?: number | string;
  total_due_all?: number | string;
  created_at?: string;
}

export interface SettlementsListResponse {
  total: number;
  limit: number;
  offset: number;
  settlements: SettlementSummaryItem[];
}
