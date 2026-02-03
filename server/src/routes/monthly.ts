import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

// Default expense categories for new months
const DEFAULT_CATEGORIES = [
  { name: "Rent", budgeted: 0, showPaidStatus: true },
  { name: "Groceries", budgeted: 0, showPaidStatus: false },
  { name: "Car Insurance", budgeted: 0, showPaidStatus: true },
  { name: "Clothes", budgeted: 0, showPaidStatus: false },
  { name: "Other", budgeted: 0, showPaidStatus: false },
];

// Get all months (list)
router.get("/", async (req: Request, res: Response) => {
  try {
    const months = await prisma.monthlyData.findMany({
      orderBy: { month: "desc" },
      select: { id: true, month: true },
    });
    res.json(months);
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: "Failed to fetch months" });
  }
});

// Get or create monthly data for a specific month
router.get("/:month", async (req: Request, res: Response) => {
  const { month } = req.params;

  // Validate month format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
  }

  try {
    let monthlyData = await prisma.monthlyData.findUnique({
      where: { month },
      include: {
        incomeSources: true,
        expenseCategories: true,
      },
    });

    // If month doesn't exist, create it by cloning from previous month
    if (!monthlyData) {
      // Find the most recent previous month
      const previousMonth = await prisma.monthlyData.findFirst({
        where: { month: { lt: month } },
        orderBy: { month: "desc" },
        include: { expenseCategories: true },
      });

      // Determine categories to use
      const categoriesToClone = previousMonth?.expenseCategories.length
        ? previousMonth.expenseCategories.map((cat) => ({
            name: cat.name,
            budgeted: cat.budgeted,
            actual: new Decimal(0),
            isPaid: false,
            showPaidStatus: cat.showPaidStatus,
          }))
        : DEFAULT_CATEGORIES.map((cat) => ({
            name: cat.name,
            budgeted: new Decimal(cat.budgeted),
            actual: new Decimal(0),
            isPaid: false,
            showPaidStatus: cat.showPaidStatus,
          }));

      // Create new month with cloned categories
      monthlyData = await prisma.monthlyData.create({
        data: {
          month,
          expenseCategories: {
            create: categoriesToClone,
          },
        },
        include: {
          incomeSources: true,
          expenseCategories: true,
        },
      });
    }

    res.json(monthlyData);
  } catch (error) {
    console.error("Error fetching/creating month:", error);
    res.status(500).json({ error: "Failed to fetch month data" });
  }
});

// Delete a month
router.delete("/:month", async (req: Request, res: Response) => {
  const { month } = req.params;

  try {
    await prisma.monthlyData.delete({
      where: { month },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting month:", error);
    res.status(500).json({ error: "Failed to delete month" });
  }
});

// === Income Source Routes ===

// Add income source
router.post("/:month/income", async (req: Request, res: Response) => {
  const { month } = req.params;
  const { name, expected, actual } = req.body;

  try {
    const monthlyData = await prisma.monthlyData.findUnique({
      where: { month },
    });

    if (!monthlyData) {
      return res.status(404).json({ error: "Month not found" });
    }

    const income = await prisma.incomeSource.create({
      data: {
        name: name || "New Income",
        expected: new Decimal(expected || 0),
        actual: new Decimal(actual || 0),
        monthlyDataId: monthlyData.id,
      },
    });

    res.json(income);
  } catch (error) {
    console.error("Error adding income:", error);
    res.status(500).json({ error: "Failed to add income" });
  }
});

// Update income source
router.patch("/income/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, expected, actual } = req.body;

  try {
    const updateData: { name?: string; expected?: Decimal; actual?: Decimal } =
      {};
    if (name !== undefined) updateData.name = name;
    if (expected !== undefined) updateData.expected = new Decimal(expected);
    if (actual !== undefined) updateData.actual = new Decimal(actual);

    const income = await prisma.incomeSource.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(income);
  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ error: "Failed to update income" });
  }
});

// Delete income source
router.delete("/income/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.incomeSource.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({ error: "Failed to delete income" });
  }
});

// === Expense Category Routes ===

// Add expense category
router.post("/:month/expense", async (req: Request, res: Response) => {
  const { month } = req.params;
  const { name, budgeted } = req.body;

  try {
    const monthlyData = await prisma.monthlyData.findUnique({
      where: { month },
    });

    if (!monthlyData) {
      return res.status(404).json({ error: "Month not found" });
    }

    const expense = await prisma.expenseCategory.create({
      data: {
        name: name || "New Category",
        budgeted: new Decimal(budgeted || 0),
        actual: new Decimal(0),
        isPaid: false,
        showPaidStatus: false,
        monthlyDataId: monthlyData.id,
      },
    });

    res.json(expense);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ error: "Failed to add expense" });
  }
});

// Update expense category
router.patch("/expense/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, budgeted, actual, isPaid, showPaidStatus } = req.body;

  try {
    const updateData: {
      name?: string;
      budgeted?: Decimal;
      actual?: Decimal;
      isPaid?: boolean;
      showPaidStatus?: boolean;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (budgeted !== undefined) updateData.budgeted = new Decimal(budgeted);
    if (actual !== undefined) updateData.actual = new Decimal(actual);
    if (isPaid !== undefined) updateData.isPaid = isPaid;
    if (showPaidStatus !== undefined)
      updateData.showPaidStatus = showPaidStatus;

    const expense = await prisma.expenseCategory.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// Delete expense category
router.delete("/expense/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.expenseCategory.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
