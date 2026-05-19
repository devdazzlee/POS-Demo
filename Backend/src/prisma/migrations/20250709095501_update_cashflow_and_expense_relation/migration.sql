-- AlterTable
ALTER TABLE "CashFlow" ALTER COLUMN "closing" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();
