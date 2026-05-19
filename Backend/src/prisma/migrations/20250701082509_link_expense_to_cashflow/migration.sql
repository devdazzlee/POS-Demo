/*
  Warnings:

  - You are about to drop the column `expenses` on the `CashFlow` table. All the data in the column will be lost.
  - Added the required column `cashflow_id` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CashFlow" DROP COLUMN "expenses";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "cashflow_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_cashflow_id_fkey" FOREIGN KEY ("cashflow_id") REFERENCES "CashFlow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
