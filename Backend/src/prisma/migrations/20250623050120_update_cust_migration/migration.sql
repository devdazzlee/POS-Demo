-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "billing_address" TEXT;
