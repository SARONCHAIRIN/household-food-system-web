export type NavTab = 'dashboard' | 'meals' | 'deposits' | 'bills' | 'profile';

export interface HouseholdMember {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isCurrentUser: boolean;
  status: 'ACTIVE' | 'AWAY';
  awayNote?: string;
  role: 'Household Admin' | 'Resident' | 'Chef Lead';
  roleTag?: 'ADMIN' | 'CHEF';
  room: string;
  phone: string;
  email: string;
  paymentMethod: string;
  mealsThisMonth: number;
  baseFoodCost: number;
  sharedPantryCost: number;
  totalDue: number;
  paidAmount: number;
  netDue: number; // positive = owes, negative = credited/overpaid, 0 = settled
  settlementStatus: 'settled' | 'pending' | 'net_due' | 'credit';
  settlementBadgeText: string;
  dietaryPreferences: string[];
  cookingRotation: string;
  specialNote?: string;
}

export interface MealHistoryItem {
  id: string;
  title: string;
  dateStr: string;
  mealType: string;
  status: 'EAT' | 'SKIPPED';
  cost: number;
  savedCost?: number;
  icon: string;
}

export interface DateStripDay {
  dayName: string;
  dayNumber: number;
  isToday?: boolean;
  hasMealAttended?: boolean;
  hasMealSkipped?: boolean;
  isUpcoming?: boolean;
  fullDate: string;
}

export interface TodayMeal {
  title: string;
  description: string;
  dateStr: string;
  timeStr: string;
  lockCountdown: string;
  cutOffTime: string;
  confirmedCount: number;
  totalMembers: number;
  estPrice: number;
  chefName: string;
  chefAvatar?: string;
  image: string;
  imageAlt: string;
  userAttendance: 'EAT' | 'SKIPPED';
}

export interface ExpensePoolData {
  monthName: string;
  dateRangeText: string;
  currentPoolCost: number;
  monthlyBudget: number;
  budgetPercentage: number;
  budgetRemaining: number;
  groceriesCost: number;
  groceriesPercentage: number;
  pantryCost: number;
  pantryPercentage: number;
  aggregatedTotal: number;
  foodPrepTotal: number;
  pantryStockTotal: number;
  activeDinersCount: number;
  totalMealsEaten: number;
  cycleClosed: boolean;
}

export interface MealVoteOption {
  id: string;
  dishName: string;
  cuisine: string;
  proposedBy: string;
  votes: number;
  userVoted?: boolean;
  tags: string[];
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: 'Groceries' | 'Pantry' | 'Household Supplies';
  paidById: string;
  paidByName: string;
  date: string;
  splitType: 'pro-rata' | 'equal';
}
