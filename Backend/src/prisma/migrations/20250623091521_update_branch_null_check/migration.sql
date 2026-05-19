-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_branch_id_fkey";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "branch_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
