import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

interface MonthlyBreakdownItem {
  month: string;
  expectedIncome: number;
  actualIncome: number;
  effectiveIncome: number;
  budgeted: number;
  actualExpenses: number;
  savings: number;
}

// Get yearly summary data
router.get("/:year", async (req: Request, res: Response) => {
  const { year } = req.params;

  // Validate year format
  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: "Invalid year format. Use YYYY" });
  }

  try {
    // Get all months for the year
    const months = await prisma.monthlyData.findMany({
      where: {
        month: {
          startsWith: year,
        },
      },
      include: {
        incomeSources: true,
        expenseCategories: true,
      },
      orderBy: { month: "asc" },
    });

    // Calculate yearly totals
    let totalExpectedIncome = 0;
    let totalActualIncome = 0;
    let totalBudgeted = 0;
    let totalActualExpenses = 0;

    // Monthly breakdown for charts
    const monthlyBreakdown: MonthlyBreakdownItem[] = [];

    // Category totals for the year
    const categoryTotals: Record<string, { budgeted: number; actual: number }> =
      {};

    for (const month of months) {
      const monthExpectedIncome = month.incomeSources.reduce(
        (sum, inc) => sum + parseFloat(inc.expected.toString()),
        0,
      );
      const monthActualIncome = month.incomeSources.reduce(
        (sum, inc) => sum + parseFloat(inc.actual.toString()),
        0,
      );
      const monthBudgeted = month.expenseCategories.reduce(
        (sum, exp) => sum + parseFloat(exp.budgeted.toString()),
        0,
      );
      const monthActualExpenses = month.expenseCategories.reduce(
        (sum, exp) => sum + parseFloat(exp.actual.toString()),
        0,
      );

      totalExpectedIncome += monthExpectedIncome;
      totalActualIncome += monthActualIncome;
      totalBudgeted += monthBudgeted;
      totalActualExpenses += monthActualExpenses;

      // Calculate effective income (higher of expected or actual)
      const effectiveIncome = Math.max(monthExpectedIncome, monthActualIncome);

      monthlyBreakdown.push({
        month: month.month,
        expectedIncome: monthExpectedIncome,
        actualIncome: monthActualIncome,
        effectiveIncome,
        budgeted: monthBudgeted,
        actualExpenses: monthActualExpenses,
        savings: effectiveIncome - monthActualExpenses,
      });

      // Aggregate category data
      for (const exp of month.expenseCategories) {
        if (!categoryTotals[exp.name]) {
          categoryTotals[exp.name] = { budgeted: 0, actual: 0 };
        }
        categoryTotals[exp.name].budgeted += parseFloat(
          exp.budgeted.toString(),
        );
        categoryTotals[exp.name].actual += parseFloat(exp.actual.toString());
      }
    }

    // Convert category totals to array and sort by actual spending
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, data]) => ({
        name,
        budgeted: data.budgeted,
        actual: data.actual,
        variance: data.budgeted - data.actual,
      }))
      .sort((a, b) => b.actual - a.actual);

    // Calculate stats
    const monthCount = months.length || 1;
    const totalEffectiveIncome = Math.max(
      totalExpectedIncome,
      totalActualIncome,
    );
    const totalSavings = totalEffectiveIncome - totalActualExpenses;
    const savingsRate =
      totalEffectiveIncome > 0
        ? (totalSavings / totalEffectiveIncome) * 100
        : 0;
    const avgMonthlyExpenses = totalActualExpenses / monthCount;
    const avgMonthlyIncome = totalEffectiveIncome / monthCount;
    const avgMonthlySavings = totalSavings / monthCount;

    // Find best and worst months
    const sortedBySavings = [...monthlyBreakdown].sort(
      (a, b) => b.savings - a.savings,
    );
    const bestMonth = sortedBySavings[0] || null;
    const worstMonth = sortedBySavings[sortedBySavings.length - 1] || null;

    // Find highest spending month
    const sortedByExpenses = [...monthlyBreakdown].sort(
      (a, b) => b.actualExpenses - a.actualExpenses,
    );
    const highestSpendingMonth = sortedByExpenses[0] || null;

    res.json({
      year,
      monthCount: months.length,
      totals: {
        expectedIncome: totalExpectedIncome,
        actualIncome: totalActualIncome,
        effectiveIncome: totalEffectiveIncome,
        budgeted: totalBudgeted,
        actualExpenses: totalActualExpenses,
        savings: totalSavings,
      },
      averages: {
        monthlyIncome: avgMonthlyIncome,
        monthlyExpenses: avgMonthlyExpenses,
        monthlySavings: avgMonthlySavings,
      },
      savingsRate,
      monthlyBreakdown,
      categoryBreakdown,
      highlights: {
        bestMonth,
        worstMonth,
        highestSpendingMonth,
        topSpendingCategory: categoryBreakdown[0] || null,
      },
    });
  } catch (error) {
    console.error("Error fetching yearly data:", error);
    res.status(500).json({ error: "Failed to fetch yearly data" });
  }
});

// Get list of years with data
router.get("/", async (req: Request, res: Response) => {
  try {
    const months = await prisma.monthlyData.findMany({
      select: { month: true },
      orderBy: { month: "desc" },
    });

    const years = [...new Set(months.map((m) => m.month.substring(0, 4)))];
    res.json(years);
  } catch (error) {
    console.error("Error fetching years:", error);
    res.status(500).json({ error: "Failed to fetch years" });
  }
});

export default router;
