export type Role = 'ADMIN' | 'MEMBER' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'AWAY';
export type MealConfirmationStatus = 'EAT' | 'NOT_EAT';
export type TransactionType = 'DEPOSIT' | 'DEDUCTION';
export type SettlementStatus = 'SUCCESSFULLY_DEDUCTED' | 'INSUFFICIENT_DEPOSIT_PARTIAL_OR_DEBT';

export interface ApiUser {
  id: string | number;
  name: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  joined_at?: string;
  inactive_at?: string | null;
  created_at?: string;
  avatar_url?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken?: string;
  userId?: string | number;
  name?: string;
  username?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
}

export interface DecodedJwt {
  id: string;
  username: string;
  role: Role;
  exp?: number;
  iat?: number;
}

export interface DailyCost {
  id: string | number;
  date: string;
  foodPrice?: number | string;
  food_price?: number | string;
  ingredientPrice?: number | string;
  ingredient_price?: number | string;
  eatCount?: number;
  eat_count?: number;
  totalMemberCount?: number;
  total_member_count?: number;
  calculationStatus?: string;
  calculation_status?: string;
  cost_food_per_person?: string | number;
  cost_ingredient_per_person?: string | number;
  created_by?: string | number;
  created_at?: string;
  menu_title?: string;
  menu_title_kh?: string;
}

export type ConfirmationType = 'AUTO' | 'MANUAL';

export interface MealStatusRecord {
  id: string | number;
  memberId?: string | number;
  member_id?: string | number;
  date: string;
  status: MealConfirmationStatus;
  confirmation_type?: ConfirmationType | string;
  confirmationType?: ConfirmationType | string;
  confirmed_at?: string;
  cost_food?: string | number | null;
  cost_ingredient?: string | number | null;
  cost_total?: string | number | null;
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

export interface TransactionRecord {
  id: string | number;
  type: TransactionType;
  amount: number | string;
  note?: string;
  created_at?: string;
  createdAt?: string;
  balance_after?: number | string;
}

export interface DepositBalanceResponse {
  userId: string | number;
  balance: number | string;
  userName?: string;
  totalTransactions?: number;
  transactions?: TransactionRecord[];
  history?: TransactionRecord[];
}

export interface MemberDepositSummary {
  userId: string | number;
  name: string;
  username: string;
  status: UserStatus;
  balance: number | string;
  totalTransactions: number;
  history?: TransactionRecord[];
}

export interface AllDepositsResponse {
  totalMembers: number;
  deposits: MemberDepositSummary[];
}

export interface MemberDueSummary {
  memberId: string | number;
  name: string;
  username: string;
  status: UserStatus;
  daysEaten: number;
  foodCost: number | string;
  ingredientCost: number | string;
  totalDue: number | string;
}

export interface BillsSummaryResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  totalMembers: number;
  activeMembersCount: number;
  poolSummary: {
    totalFoodPrice: number | string;
    totalIngredientPrice: number | string;
  };
  memberSummaries: MemberDueSummary[];
}

export interface SettlementMemberResult {
  userId: string | number;
  name: string;
  totalDue: number | string;
  previousDepositBalance: number | string;
  deductedAmount: number | string;
  settlementStatus: SettlementStatus;
}

export interface SettleBillsResponse {
  message: string;
  period: {
    startDate: string;
    endDate: string;
  };
  results: SettlementMemberResult[];
}

export interface LastSettlementResponse {
  id: string | number;
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
  results?: SettlementMemberResult[];
}

export interface SettlementHistoryItem {
  id: string | number;
  start_date: string;
  end_date: string;
  settled_by_name: string;
  total_food_cost: number | string;
  total_ingredient_cost: number | string;
  total_due_all: number | string;
  created_at: string;
}

export interface SettlementHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  settlements: SettlementHistoryItem[];
}
