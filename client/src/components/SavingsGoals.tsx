import { useState, useEffect, useCallback } from "react";
import type { SavingsGoal } from "../types";
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

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<number | null>(null);

  // Fetch savings goals
  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/savings");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Add new goal
  const addGoal = async () => {
    try {
      const response = await apiFetch("/savings", {
        method: "POST",
        body: JSON.stringify({
          name: "New Goal",
          targetAmount: 1000,
          currentAmount: 0,
        }),
      });
      if (!response.ok) throw new Error("Failed to add goal");
      fetchGoals();
    } catch (err) {
      console.error("Error adding goal:", err);
    }
  };

  // Update goal
  const updateGoal = async (id: number, updates: Partial<SavingsGoal>) => {
    try {
      const body: Record<string, unknown> = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.targetAmount !== undefined)
        body.targetAmount = parseFloat(updates.targetAmount);
      if (updates.currentAmount !== undefined)
        body.currentAmount = parseFloat(updates.currentAmount);

      const response = await apiFetch(`/savings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update goal");
      fetchGoals();
    } catch (err) {
      console.error("Error updating goal:", err);
    }
  };

  // Delete goal
  const deleteGoal = async (id: number) => {
    try {
      const response = await apiFetch(`/savings/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete goal");
      fetchGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between border border-ledger-border p-4">
        <h1 className="text-xl font-semibold tracking-tight">Savings Goals</h1>
        <button
          onClick={addGoal}
          className="px-4 py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
        >
          Add Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="border border-ledger-border p-12 text-center">
          <p className="text-ledger-accent mb-4">No savings goals yet.</p>
          <button
            onClick={addGoal}
            className="px-4 py-2 text-sm font-medium text-ledger-accent hover:text-ledger-text hover:bg-zinc-800 border border-ledger-border transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isEditing={editingGoal === goal.id}
              onEdit={() =>
                setEditingGoal(editingGoal === goal.id ? null : goal.id)
              }
              onUpdate={updateGoal}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: SavingsGoal;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (id: number, updates: Partial<SavingsGoal>) => void;
  onDelete: (id: number) => void;
}

function GoalCard({
  goal,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
}: GoalCardProps) {
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount);
  const [currentAmount, setCurrentAmount] = useState(goal.currentAmount);

  const target = parseFloat(goal.targetAmount) || 0;
  const current = parseFloat(goal.currentAmount) || 0;
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  const handleSave = () => {
    onUpdate(goal.id, { name, targetAmount, currentAmount });
    onEdit();
  };

  const handleCancel = () => {
    setName(goal.name);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    onEdit();
  };

  return (
    <div className="border border-ledger-border">
      {/* Card Header */}
      <div className="border-b border-ledger-border px-4 py-3 flex items-center justify-between">
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-transparent border border-ledger-border px-2 py-1 text-sm font-semibold focus:outline-none focus:border-ledger-accent"
          />
        ) : (
          <h3 className="text-sm font-semibold">{goal.name}</h3>
        )}
        <div className="flex items-center gap-2 ml-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                title="Save"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-ledger-accent hover:text-ledger-text transition-colors"
                title="Cancel"
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
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="p-1 text-ledger-accent hover:text-ledger-text transition-colors"
                title="Edit"
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDelete(goal.id)}
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
              Current
            </div>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-ledger-accent text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  step="0.01"
                  className="w-full bg-transparent border border-ledger-border pl-6 pr-2 py-1 text-sm focus:outline-none focus:border-ledger-accent"
                />
              </div>
            ) : (
              <div className="text-lg font-semibold">
                {formatCurrency(goal.currentAmount)}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ledger-accent mb-1">
              Target
            </div>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-ledger-accent text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  step="0.01"
                  className="w-full bg-transparent border border-ledger-border pl-6 pr-2 py-1 text-sm focus:outline-none focus:border-ledger-accent"
                />
              </div>
            ) : (
              <div className="text-lg font-semibold">
                {formatCurrency(goal.targetAmount)}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar - Sharp rectangular edges */}
        <div>
          <div className="flex items-center justify-between text-xs text-ledger-accent mb-2">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-zinc-800 border border-ledger-border">
            <div
              className="h-full bg-ledger-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Remaining */}
        <div className="pt-2 border-t border-ledger-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ledger-accent">Remaining</span>
            <span
              className={`text-sm font-medium ${target - current <= 0 ? "text-green-400" : ""}`}
            >
              {formatCurrency(Math.max(target - current, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
