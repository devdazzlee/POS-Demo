-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "particular" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlow" (
    "id" TEXT NOT NULL,
    "opening" DECIMAL(65,30) NOT NULL,
    "sales" DECIMAL(65,30) NOT NULL,
    "expenses" DECIMAL(65,30) NOT NULL,
    "closing" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashFlow_pkey" PRIMARY KEY ("id")
);
