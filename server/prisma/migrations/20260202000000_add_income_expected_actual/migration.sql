-- AlterTable - Add expected and actual to IncomeSource, rename amount
ALTER TABLE "IncomeSource" RENAME COLUMN "amount" TO "expected";
ALTER TABLE "IncomeSource" ADD COLUMN "actual" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable - Add showPaidStatus to ExpenseCategory
ALTER TABLE "ExpenseCategory" ADD COLUMN "showPaidStatus" BOOLEAN NOT NULL DEFAULT false;

-- Set showPaidStatus to true for Rent and Car Insurance categories
UPDATE "ExpenseCategory" SET "showPaidStatus" = true WHERE "name" IN ('Rent', 'Car Insurance');
