-- CreateEnum
CREATE TYPE "CashFlowStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "CashFlow" ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "CashFlowStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
