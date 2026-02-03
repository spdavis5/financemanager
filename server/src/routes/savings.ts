import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

// Get all savings goals
router.get("/", async (req: Request, res: Response) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(goals);
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    res.status(500).json({ error: "Failed to fetch savings goals" });
  }
});

// Get a single savings goal
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const goal = await prisma.savingsGoal.findUnique({
      where: { id: parseInt(id) },
    });

    if (!goal) {
      return res.status(404).json({ error: "Savings goal not found" });
    }

    res.json(goal);
  } catch (error) {
    console.error("Error fetching savings goal:", error);
    res.status(500).json({ error: "Failed to fetch savings goal" });
  }
});

// Create a new savings goal
router.post("/", async (req: Request, res: Response) => {
  const { name, targetAmount, currentAmount } = req.body;

  try {
    const goal = await prisma.savingsGoal.create({
      data: {
        name: name || "New Goal",
        targetAmount: new Decimal(targetAmount || 0),
        currentAmount: new Decimal(currentAmount || 0),
      },
    });

    res.json(goal);
  } catch (error) {
    console.error("Error creating savings goal:", error);
    res.status(500).json({ error: "Failed to create savings goal" });
  }
});

// Update a savings goal
router.patch("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, targetAmount, currentAmount } = req.body;

  try {
    const updateData: {
      name?: string;
      targetAmount?: Decimal;
      currentAmount?: Decimal;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (targetAmount !== undefined)
      updateData.targetAmount = new Decimal(targetAmount);
    if (currentAmount !== undefined)
      updateData.currentAmount = new Decimal(currentAmount);

    const goal = await prisma.savingsGoal.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(goal);
  } catch (error) {
    console.error("Error updating savings goal:", error);
    res.status(500).json({ error: "Failed to update savings goal" });
  }
});

// Delete a savings goal
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.savingsGoal.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    res.status(500).json({ error: "Failed to delete savings goal" });
  }
});

export default router;
