/*
  Warnings:

  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "images",
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CategoryImages" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryImages_category_id_idx" ON "CategoryImages"("category_id");

-- CreateIndex
CREATE INDEX "ProductImage_product_id_idx" ON "ProductImage"("product_id");

-- CreateIndex
CREATE INDEX "Product_is_featured_idx" ON "Product"("is_featured");

-- AddForeignKey
ALTER TABLE "CategoryImages" ADD CONSTRAINT "CategoryImages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
