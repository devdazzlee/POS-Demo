-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "has_images" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "error" TEXT,
ADD COLUMN     "status" "ImageStatus" NOT NULL DEFAULT 'PENDING';
