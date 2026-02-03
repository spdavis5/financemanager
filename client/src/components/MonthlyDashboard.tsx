import { useState, useEffect, useCallback } from "react";
import type { MonthlyData, IncomeSource, ExpenseCategory } from "../types";
import { apiFetch } from "../api";

// Helper to format currency
const formatCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num || 0);
};

// Get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Parse month string to Date
const parseMonth = (month: string): Date => {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1);
};

// Format month for display
const formatMonthDisplay = (month: string): string => {
  const date = parseMonth(month);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// Navigate months
const navigateMonth = (current: string, direction: "prev" | "next"): string => {
  const date = parseMonth(current);
  if (direction === "prev") {
    date.setMonth(date.getMonth() - 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export default function MonthlyDashboard() {
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch monthly data
  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/monthly/${currentMonth}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setMonthlyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // Income handlers
  const addIncome = async () => {
    try {
      const response = await apiFetch(`/monthly/${currentMonth}/income`, {
        method: "POST",
        body: JSON.stringify({ name: "New Income", expected: 0, actual: 0 }),
      });
      if (!response.ok) throw new Error("Failed to add income");
      const newIncome = await response.json();
      // Update local state instead of refetching
      setMonthlyData((prev) =>
        prev
          ? { ...prev, incomeSources: [...prev.incomeSources, newIncome] }
          : prev,
      );
    } catch (err) {
      console.error("Error adding income:", err);
    }
  };

  const updateIncome = async (
    id: number,
    field: "name" | "expected" | "actual",
    value: string,
  ) => {
    try {
      const body =
        field === "name"
          ? { name: value }
          : { [field]: parseFloat(value) || 0 };
      const response = await apiFetch(`/monthly/income/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update income");
      const updatedIncome = await response.json();
      // Update local state instead of refetching
      setMonthlyData((prev) =>
        prev
          ? {
              ...prev,
              incomeSources: prev.incomeSources.map((inc) =>
                inc.id === id ? updatedIncome : inc,
              ),
            }
          : prev,
      );
    } catch (err) {
      console.error("Error updating income:", err);
    }
  };

  const deleteIncome = async (id: number) => {
    try {
      const response = await apiFetch(`/monthly/income/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete income");
      // Update local state instead of refetching
      setMonthlyData((prev) =>
        prev
          ? {
              ...prev,
              incomeSources: prev.incomeSources.filter((inc) => inc.id !== id),
            }
          : prev,
      );
    } catch (err) {
      console.error("Error deleting income:", err);
    }
  };

  // Expense handlers
  const addExpense = async () => {
    try {
      const response = await apiFetch(`/monthly/${currentMonth}/expense`, {
        method: "POST",
        body: JSON.stringify({ name: "New Category", budgeted: 0 }),
      });
      if (!response.ok) throw new Error("Failed to add expense");
      const newExpense = await response.json();
      // Update local state instead of refetching
      setMonthlyData((prev) =>
        prev
          ? {
              ...prev,
              expenseCategories: [...prev.expenseCategories, newExpense],
            }
          : prev,
      );
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

  const updateExpense = async (
    id: number,
    field: "name" | "budgeted" | "actual" | "isPaid" | "showPaidStatus",
    value: string | boolean,
  ) => {
    try {
      let body: Record<string, unknown>;
      if (field === "isPaid" || field === "showPaidStatus") {
        body = { [field]: value };
      } else if (field === "name") {
        body = { name: value };
      } else {
        body = { [field]: parseFloat(value as string) || 0 };
      }

      const response = await apiFetch(`/monthly/expense/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update expense");
      const updatedExpense = await response.json();
      // Update local state instead of refetching
      setMonthlyData((prev) =>
        prev
          ? {
              ...prev,
              expenseCategories: prev.expenseCategories.map((exp) =>
                exp.id === id ? updatedExpense : exp,
              ),
            }
          : prev,
      );
    } catch (err) {
      console.error("Error updating expense:", err);
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      const response = await apiFetch(`/monthly/expense/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete expense");
      // Update local state instead of refetching
      setMonthlyData((prev) =>
        prev
          ? {
              ...prev,
              expenseCategories: prev.expenseCategories.filter(
                (exp) => exp.id !== id,
              ),
            }
          : prev,
      );
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  // Calculate totals
  const totalExpectedIncome =
    monthlyData?.incomeSources.reduce(
      (sum, inc) => sum + parseFloat(inc.expected || "0"),
      0,
    ) || 0;

  const totalActualIncome =
    monthlyData?.incomeSources.reduce(
      (sum, inc) => sum + parseFloat(inc.actual || "0"),
      0,
    ) || 0;

  // Use the higher of expected or actual income for calculations
  const effectiveIncome = Math.max(totalExpectedIncome, totalActualIncome);

  const totalActualExpenses =
    monthlyData?.expenseCategories.reduce(
      (sum, exp) => sum + parseFloat(exp.actual || "0"),
      0,
    ) || 0;

  const totalBudgetedExpenses =
    monthlyData?.expenseCategories.reduce(
      (sum, exp) => sum + parseFloat(exp.budgeted || "0"),
      0,
    ) || 0;

  const remainingFunds = effectiveIncome - totalActualExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ledger-accent">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between border border-ledger-border p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(navigateMonth(currentMonth, "prev"))}
            className="px-4 py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentMonth(navigateMonth(currentMonth, "next"))}
            className="px-4 py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
          >
            Next
          </button>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {formatMonthDisplay(currentMonth)}
        </h1>
        <div className="flex items-center">
          {currentMonth !== getCurrentMonth() ? (
            <button
              onClick={() => setCurrentMonth(getCurrentMonth())}
              className="px-4 py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
            >
              Current Month
            </button>
          ) : (
            <div className="px-4 py-2 text-sm font-medium text-transparent">
              Current Month
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="border border-ledger-border p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
              Expected Income
            </div>
            <div
              className={`text-2xl font-semibold ${totalExpectedIncome >= totalActualIncome ? "text-green-400" : "text-ledger-accent"}`}
            >
              {formatCurrency(totalExpectedIncome)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
              Actual Income
            </div>
            <div
              className={`text-2xl font-semibold ${totalActualIncome > totalExpectedIncome ? "text-green-400" : "text-ledger-accent"}`}
            >
              {formatCurrency(totalActualIncome)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
              Budgeted
            </div>
            <div className="text-2xl font-semibold">
              {formatCurrency(totalBudgetedExpenses)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
              Actual Spent
            </div>
            <div className="text-2xl font-semibold text-red-400">
              {formatCurrency(totalActualExpenses)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
              Remaining Funds
            </div>
            <div
              className={`text-2xl font-semibold ${remainingFunds >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {formatCurrency(remainingFunds)}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Column */}
        <div className="border border-ledger-border">
          <div className="border-b border-ledger-border px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Income Sources
            </h2>
            <button
              onClick={addIncome}
              className="px-3 py-1 text-xs font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
            >
              Add Income
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs uppercase tracking-wide text-ledger-accent border-b border-ledger-border bg-zinc-900/30">
            <div className="col-span-4">Source</div>
            <div className="col-span-3 text-right">Expected</div>
            <div className="col-span-3 text-right">Actual</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-ledger-border">
            {monthlyData?.incomeSources.length === 0 ? (
              <div className="px-4 py-8 text-center text-ledger-accent text-sm">
                No income sources. Add one to get started.
              </div>
            ) : (
              monthlyData?.incomeSources.map((income) => (
                <IncomeRow
                  key={income.id}
                  income={income}
                  onUpdate={updateIncome}
                  onDelete={deleteIncome}
                />
              ))
            )}
          </div>
          <div className="border-t border-ledger-border px-4 py-3 flex justify-between items-center bg-zinc-900/50">
            <span className="text-sm font-medium text-ledger-accent">
              Total Actual Income
            </span>
            <span className="text-lg font-semibold text-green-400">
              {formatCurrency(totalActualIncome)}
            </span>
          </div>
        </div>

        {/* Expenses Column */}
        <div className="border border-ledger-border">
          <div className="border-b border-ledger-border px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Expense Categories
            </h2>
            <button
              onClick={addExpense}
              className="px-3 py-1 text-xs font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
            >
              Add Category
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs uppercase tracking-wide text-ledger-accent border-b border-ledger-border bg-zinc-900/30">
            <div className="col-span-3">Category</div>
            <div className="col-span-2 text-right">Budgeted</div>
            <div className="col-span-2 text-right">Actual</div>
            <div className="col-span-2 text-center">Paid</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          <div className="divide-y divide-ledger-border">
            {monthlyData?.expenseCategories.length === 0 ? (
              <div className="px-4 py-8 text-center text-ledger-accent text-sm">
                No expense categories. Add one to get started.
              </div>
            ) : (
              monthlyData?.expenseCategories.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onUpdate={updateExpense}
                  onDelete={deleteExpense}
                />
              ))
            )}
          </div>
          <div className="border-t border-ledger-border px-4 py-3 flex justify-between items-center bg-zinc-900/50">
            <span className="text-sm font-medium text-ledger-accent">
              Total Actual
            </span>
            <span className="text-lg font-semibold text-red-400">
              {formatCurrency(totalActualExpenses)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Income Row Component
interface IncomeRowProps {
  income: IncomeSource;
  onUpdate: (
    id: number,
    field: "name" | "expected" | "actual",
    value: string,
  ) => void;
  onDelete: (id: number) => void;
}

function IncomeRow({ income, onUpdate, onDelete }: IncomeRowProps) {
  const [name, setName] = useState(income.name);
  const [expected, setExpected] = useState(income.expected);
  const [actual, setActual] = useState(income.actual);

  // Update local state when prop changes
  useEffect(() => {
    setName(income.name);
    setExpected(income.expected);
    setActual(income.actual);
  }, [income.name, income.expected, income.actual]);

  const handleFieldBlur = (
    field: "name" | "expected" | "actual",
    current: string,
    original: string,
  ) => {
    if (current !== original) {
      onUpdate(income.id, field, current);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
      <div className="col-span-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleFieldBlur("name", name, income.name)}
          className="w-full bg-transparent border border-ledger-border px-2 py-1 text-sm focus:outline-none focus:border-ledger-accent"
          placeholder="Income name"
        />
      </div>
      <div className="col-span-3">
        <input
          type="number"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          onBlur={() => handleFieldBlur("expected", expected, income.expected)}
          step="0.01"
          className="w-full bg-transparent border border-ledger-border px-2 py-1 text-sm text-right focus:outline-none focus:border-ledger-accent"
          placeholder="0.00"
        />
      </div>
      <div className="col-span-3">
        <input
          type="number"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          onBlur={() => handleFieldBlur("actual", actual, income.actual)}
          step="0.01"
          className="w-full bg-transparent border border-ledger-border px-2 py-1 text-sm text-right focus:outline-none focus:border-ledger-accent"
          placeholder="0.00"
        />
      </div>
      <div className="col-span-2 flex justify-end">
        <button
          onClick={() => onDelete(income.id)}
          className="p-1 text-ledger-accent hover:text-red-400 transition-colors"
          title="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Expense Row Component
interface ExpenseRowProps {
  expense: ExpenseCategory;
  onUpdate: (
    id: number,
    field: "name" | "budgeted" | "actual" | "isPaid" | "showPaidStatus",
    value: string | boolean,
  ) => void;
  onDelete: (id: number) => void;
}

function ExpenseRow({ expense, onUpdate, onDelete }: ExpenseRowProps) {
  const [name, setName] = useState(expense.name);
  const [budgeted, setBudgeted] = useState(expense.budgeted);
  const [actual, setActual] = useState(expense.actual);

  // Update local state when prop changes
  useEffect(() => {
    setName(expense.name);
    setBudgeted(expense.budgeted);
    setActual(expense.actual);
  }, [expense.name, expense.budgeted, expense.actual]);

  const handleFieldBlur = (
    field: "name" | "budgeted" | "actual",
    current: string,
    original: string,
  ) => {
    if (current !== original) {
      onUpdate(expense.id, field, current);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
      <div className="col-span-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => handleFieldBlur("name", name, expense.name)}
          className="w-full bg-transparent border border-ledger-border px-2 py-1 text-sm focus:outline-none focus:border-ledger-accent"
          placeholder="Category"
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={budgeted}
          onChange={(e) => setBudgeted(e.target.value)}
          onBlur={() => handleFieldBlur("budgeted", budgeted, expense.budgeted)}
          step="0.01"
          className="w-full bg-transparent border border-ledger-border px-2 py-1 text-sm text-right focus:outline-none focus:border-ledger-accent"
          placeholder="0.00"
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          onBlur={() => handleFieldBlur("actual", actual, expense.actual)}
          step="0.01"
          className="w-full bg-transparent border border-ledger-border px-2 py-1 text-sm text-right focus:outline-none focus:border-ledger-accent"
          placeholder="0.00"
        />
      </div>
      <div className="col-span-2 flex justify-center">
        {expense.showPaidStatus ? (
          <input
            type="checkbox"
            checked={expense.isPaid}
            onChange={(e) => onUpdate(expense.id, "isPaid", e.target.checked)}
            className="w-4 h-4 accent-ledger-accent bg-transparent border-ledger-border cursor-pointer"
          />
        ) : (
          <span className="text-zinc-600">-</span>
        )}
      </div>
      <div className="col-span-3 flex justify-end gap-1">
        <button
          onClick={() =>
            onUpdate(expense.id, "showPaidStatus", !expense.showPaidStatus)
          }
          className={`p-1 transition-colors ${expense.showPaidStatus ? "text-ledger-accent" : "text-zinc-600 hover:text-ledger-accent"}`}
          title={
            expense.showPaidStatus ? "Hide paid status" : "Show paid status"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="p-1 text-ledger-accent hover:text-red-400 transition-colors"
          title="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
