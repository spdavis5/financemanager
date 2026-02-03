// Types for Finance GPT application

export interface IncomeSource {
  id: number;
  name: string;
  expected: string; // Decimal comes as string from API
  actual: string; // Decimal comes as string from API
  monthlyDataId: number;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  budgeted: string; // Decimal comes as string from API
  actual: string; // Decimal comes as string from API
  isPaid: boolean;
  showPaidStatus: boolean;
  monthlyDataId: number;
}

export interface MonthlyData {
  id: number;
  month: string; // Format: YYYY-MM
  createdAt: string;
  updatedAt: string;
  incomeSources: IncomeSource[];
  expenseCategories: ExpenseCategory[];
}

export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: string; // Decimal comes as string from API
  currentAmount: string; // Decimal comes as string from API
  createdAt: string;
  updatedAt: string;
}

export interface MonthListItem {
  id: number;
  month: string;
}
