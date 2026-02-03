import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api";

interface MonthlyBreakdown {
  month: string;
  expectedIncome: number;
  actualIncome: number;
  effectiveIncome: number;
  budgeted: number;
  actualExpenses: number;
  savings: number;
}

interface CategoryBreakdown {
  name: string;
  budgeted: number;
  actual: number;
  variance: number;
}

interface YearlyData {
  year: string;
  monthCount: number;
  totals: {
    expectedIncome: number;
    actualIncome: number;
    effectiveIncome: number;
    budgeted: number;
    actualExpenses: number;
    savings: number;
  };
  averages: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
  };
  savingsRate: number;
  monthlyBreakdown: MonthlyBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
  highlights: {
    bestMonth: MonthlyBreakdown | null;
    worstMonth: MonthlyBreakdown | null;
    highestSpendingMonth: MonthlyBreakdown | null;
    topSpendingCategory: CategoryBreakdown | null;
  };
}

// Helper to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format month for display
const formatMonthShort = (month: string): string => {
  const [, m] = month.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[m - 1] || month;
};

const formatMonthLong = (month: string): string => {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// Get current year
const getCurrentYear = (): string => {
  return new Date().getFullYear().toString();
};

export default function YearlyReview() {
  const [currentYear, setCurrentYear] = useState<string>(getCurrentYear());
  const [yearlyData, setYearlyData] = useState<YearlyData | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await apiFetch("/yearly");
        if (response.ok) {
          const years = await response.json();
          setAvailableYears(years);
        }
      } catch (err) {
        console.error("Error fetching years:", err);
      }
    };
    fetchYears();
  }, []);

  // Fetch yearly data
  const fetchYearlyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/yearly/${currentYear}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setYearlyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchYearlyData();
  }, [fetchYearlyData]);

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

  if (!yearlyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ledger-accent">No data available</div>
      </div>
    );
  }

  // Calculate max values for chart scaling
  const maxValue = Math.max(
    ...yearlyData.monthlyBreakdown.map((m) =>
      Math.max(m.effectiveIncome, m.actualExpenses),
    ),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Year Navigation */}
      <div className="flex items-center justify-between border border-ledger-border p-4">
        <button
          onClick={() => setCurrentYear((parseInt(currentYear) - 1).toString())}
          className="px-4 py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
        >
          Previous Year
        </button>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">
            {currentYear} Yearly Review
          </h1>
          {availableYears.length > 0 && (
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              className="bg-transparent border border-ledger-border px-3 py-1 text-sm focus:outline-none focus:border-ledger-accent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year} className="bg-ledger-bg">
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => setCurrentYear((parseInt(currentYear) + 1).toString())}
          className="px-4 py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
        >
          Next Year
        </button>
      </div>

      {yearlyData.monthCount === 0 ? (
        <div className="border border-ledger-border p-12 text-center">
          <p className="text-ledger-accent">
            No data available for {currentYear}.
          </p>
          <p className="text-ledger-accent text-sm mt-2">
            Start by adding income and expenses in the Monthly View.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              label="Total Income"
              value={formatCurrency(yearlyData.totals.effectiveIncome)}
              color="text-green-400"
            />
            <StatCard
              label="Total Expenses"
              value={formatCurrency(yearlyData.totals.actualExpenses)}
              color="text-red-400"
            />
            <StatCard
              label="Total Savings"
              value={formatCurrency(yearlyData.totals.savings)}
              color={
                yearlyData.totals.savings >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }
            />
            <StatCard
              label="Savings Rate"
              value={`${yearlyData.savingsRate.toFixed(1)}%`}
              color={
                yearlyData.savingsRate >= 20
                  ? "text-green-400"
                  : yearlyData.savingsRate >= 10
                    ? "text-yellow-400"
                    : "text-red-400"
              }
            />
            <StatCard
              label="Avg Monthly Spend"
              value={formatCurrency(yearlyData.averages.monthlyExpenses)}
              color="text-ledger-text"
            />
            <StatCard
              label="Months Tracked"
              value={yearlyData.monthCount.toString()}
              color="text-ledger-accent"
            />
          </div>

          {/* Income vs Expenses Chart */}
          <div className="border border-ledger-border p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-6">
              Monthly Income vs Expenses
            </h2>
            <div className="space-y-3">
              {/* Chart Legend */}
              <div className="flex items-center gap-6 text-xs text-ledger-accent mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400"></div>
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400"></div>
                  <span>Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-ledger-accent"></div>
                  <span>Savings</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-2">
                {yearlyData.monthlyBreakdown.map((month) => (
                  <div
                    key={month.month}
                    className="grid grid-cols-12 gap-3 items-center"
                  >
                    <div className="col-span-1 text-xs text-ledger-accent text-right">
                      {formatMonthShort(month.month)}
                    </div>
                    <div className="col-span-9 space-y-1">
                      {/* Income bar */}
                      <div className="h-4 bg-zinc-800 relative">
                        <div
                          className="h-full bg-green-400/80 absolute left-0 top-0"
                          style={{
                            width: `${(month.effectiveIncome / maxValue) * 100}%`,
                          }}
                        />
                      </div>
                      {/* Expenses bar */}
                      <div className="h-4 bg-zinc-800 relative">
                        <div
                          className="h-full bg-red-400/80 absolute left-0 top-0"
                          style={{
                            width: `${(month.actualExpenses / maxValue) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <div
                        className={`text-xs font-medium ${month.savings >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {month.savings >= 0 ? "+" : ""}
                        {formatCurrency(month.savings)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Spending Categories */}
            <div className="border border-ledger-border">
              <div className="border-b border-ledger-border px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  Spending by Category
                </h2>
              </div>
              <div className="p-4">
                {yearlyData.categoryBreakdown.length === 0 ? (
                  <p className="text-ledger-accent text-sm text-center py-4">
                    No expense data
                  </p>
                ) : (
                  <div className="space-y-3">
                    {yearlyData.categoryBreakdown
                      .slice(0, 8)
                      .map((cat, index) => {
                        const maxCatValue =
                          yearlyData.categoryBreakdown[0]?.actual || 1;
                        const percentage = (cat.actual / maxCatValue) * 100;
                        return (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <span className="text-ledger-accent w-4">
                                  {index + 1}.
                                </span>
                                <span>{cat.name}</span>
                              </span>
                              <span className="font-medium">
                                {formatCurrency(cat.actual)}
                              </span>
                            </div>
                            <div className="h-2 bg-zinc-800">
                              <div
                                className="h-full bg-ledger-accent"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div className="border border-ledger-border">
              <div className="border-b border-ledger-border px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  Year Highlights
                </h2>
              </div>
              <div className="p-4 space-y-4">
                {yearlyData.highlights.bestMonth && (
                  <HighlightCard
                    title="Best Month (Highest Savings)"
                    month={formatMonthLong(
                      yearlyData.highlights.bestMonth.month,
                    )}
                    value={formatCurrency(
                      yearlyData.highlights.bestMonth.savings,
                    )}
                    valueColor="text-green-400"
                  />
                )}
                {yearlyData.highlights.worstMonth && (
                  <HighlightCard
                    title="Worst Month (Lowest Savings)"
                    month={formatMonthLong(
                      yearlyData.highlights.worstMonth.month,
                    )}
                    value={formatCurrency(
                      yearlyData.highlights.worstMonth.savings,
                    )}
                    valueColor={
                      yearlyData.highlights.worstMonth.savings >= 0
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  />
                )}
                {yearlyData.highlights.highestSpendingMonth && (
                  <HighlightCard
                    title="Highest Spending Month"
                    month={formatMonthLong(
                      yearlyData.highlights.highestSpendingMonth.month,
                    )}
                    value={formatCurrency(
                      yearlyData.highlights.highestSpendingMonth.actualExpenses,
                    )}
                    valueColor="text-red-400"
                  />
                )}
                {yearlyData.highlights.topSpendingCategory && (
                  <HighlightCard
                    title="Top Spending Category"
                    month={yearlyData.highlights.topSpendingCategory.name}
                    value={formatCurrency(
                      yearlyData.highlights.topSpendingCategory.actual,
                    )}
                    valueColor="text-ledger-accent"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="border border-ledger-border">
            <div className="border-b border-ledger-border px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Monthly Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ledger-border bg-zinc-900/30">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Month
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Income
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Budgeted
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Actual
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Savings
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ledger-border">
                  {yearlyData.monthlyBreakdown.map((month) => {
                    const rate =
                      month.effectiveIncome > 0
                        ? (
                            (month.savings / month.effectiveIncome) *
                            100
                          ).toFixed(0)
                        : "0";
                    return (
                      <tr key={month.month} className="hover:bg-zinc-900/30">
                        <td className="px-4 py-3">
                          {formatMonthLong(month.month)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400">
                          {formatCurrency(month.effectiveIncome)}
                        </td>
                        <td className="px-4 py-3 text-right text-ledger-accent">
                          {formatCurrency(month.budgeted)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400">
                          {formatCurrency(month.actualExpenses)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${month.savings >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {formatCurrency(month.savings)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right ${parseFloat(rate) >= 20 ? "text-green-400" : parseFloat(rate) >= 0 ? "text-yellow-400" : "text-red-400"}`}
                        >
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-ledger-border bg-zinc-900/50">
                  <tr className="font-semibold">
                    <td className="px-4 py-3">Total / Average</td>
                    <td className="px-4 py-3 text-right text-green-400">
                      {formatCurrency(yearlyData.totals.effectiveIncome)}
                    </td>
                    <td className="px-4 py-3 text-right text-ledger-accent">
                      {formatCurrency(yearlyData.totals.budgeted)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      {formatCurrency(yearlyData.totals.actualExpenses)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${yearlyData.totals.savings >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {formatCurrency(yearlyData.totals.savings)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${yearlyData.savingsRate >= 20 ? "text-green-400" : yearlyData.savingsRate >= 0 ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {yearlyData.savingsRate.toFixed(0)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Budget vs Actual by Category */}
          <div className="border border-ledger-border">
            <div className="border-b border-ledger-border px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                Budget vs Actual by Category
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ledger-border bg-zinc-900/30">
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Budgeted
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Actual
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Variance
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-ledger-accent font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ledger-border">
                  {yearlyData.categoryBreakdown.map((cat) => (
                    <tr key={cat.name} className="hover:bg-zinc-900/30">
                      <td className="px-4 py-3">{cat.name}</td>
                      <td className="px-4 py-3 text-right text-ledger-accent">
                        {formatCurrency(cat.budgeted)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(cat.actual)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${cat.variance >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {cat.variance >= 0 ? "+" : ""}
                        {formatCurrency(cat.variance)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs ${
                            cat.variance >= 0
                              ? "bg-green-400/10 text-green-400"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {cat.variance >= 0 ? "Under Budget" : "Over Budget"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="border border-ledger-border p-4">
      <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
        {label}
      </div>
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

// Highlight Card Component
interface HighlightCardProps {
  title: string;
  month: string;
  value: string;
  valueColor: string;
}

function HighlightCard({
  title,
  month,
  value,
  valueColor,
}: HighlightCardProps) {
  return (
    <div className="border border-ledger-border p-3">
      <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
        {title}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">{month}</span>
        <span className={`font-semibold ${valueColor}`}>{value}</span>
      </div>
    </div>
  );
}
