-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "CategoryImages" ADD COLUMN     "error" TEXT,
ADD COLUMN     "status" "ImageStatus" NOT NULL DEFAULT 'PENDING';
