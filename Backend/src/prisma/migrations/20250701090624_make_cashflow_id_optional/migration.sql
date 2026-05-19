-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_cashflow_id_fkey";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "cashflow_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_cashflow_id_fkey" FOREIGN KEY ("cashflow_id") REFERENCES "CashFlow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
