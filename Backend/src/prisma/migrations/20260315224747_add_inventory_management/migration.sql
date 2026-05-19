-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('WAREHOUSE', 'BRANCH');

-- CreateEnum
CREATE TYPE "PurchaseDeliveryStatus" AS ENUM ('PARTIAL', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'DISPATCHED', 'RECEIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'PURCHASE_MANAGER';
ALTER TYPE "Role" ADD VALUE 'WAREHOUSE_MANAGER';
ALTER TYPE "Role" ADD VALUE 'BRANCH_MANAGER';

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'LOSS';

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "branch_type" "BranchType" NOT NULL DEFAULT 'BRANCH';

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "warehouse_branch_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "cost_price" DECIMAL(65,30) NOT NULL,
    "sale_price" DECIMAL(65,30) NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_ref" TEXT,
    "notes" TEXT,
    "delivery_status" "PurchaseDeliveryStatus" NOT NULL DEFAULT 'COMPLETE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "from_branch_id" TEXT NOT NULL,
    "to_branch_id" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "transfer_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_no" TEXT,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "received_at" TIMESTAMP(3),
    "received_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "system_quantity" DECIMAL(65,30) NOT NULL,
    "physical_count" DECIMAL(65,30) NOT NULL,
    "difference" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "adjustment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adjusted_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purchase_product_id_idx" ON "Purchase"("product_id");

-- CreateIndex
CREATE INDEX "Purchase_supplier_id_idx" ON "Purchase"("supplier_id");

-- CreateIndex
CREATE INDEX "Purchase_warehouse_branch_id_idx" ON "Purchase"("warehouse_branch_id");

-- CreateIndex
CREATE INDEX "Purchase_purchase_date_idx" ON "Purchase"("purchase_date");

-- CreateIndex
CREATE INDEX "Purchase_created_by_idx" ON "Purchase"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_reference_no_key" ON "Transfer"("reference_no");

-- CreateIndex
CREATE INDEX "Transfer_product_id_idx" ON "Transfer"("product_id");

-- CreateIndex
CREATE INDEX "Transfer_from_branch_id_idx" ON "Transfer"("from_branch_id");

-- CreateIndex
CREATE INDEX "Transfer_to_branch_id_idx" ON "Transfer"("to_branch_id");

-- CreateIndex
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");

-- CreateIndex
CREATE INDEX "Transfer_transfer_date_idx" ON "Transfer"("transfer_date");

-- CreateIndex
CREATE INDEX "StockAdjustment_product_id_idx" ON "StockAdjustment"("product_id");

-- CreateIndex
CREATE INDEX "StockAdjustment_branch_id_idx" ON "StockAdjustment"("branch_id");

-- CreateIndex
CREATE INDEX "StockAdjustment_adjustment_date_idx" ON "StockAdjustment"("adjustment_date");

-- CreateIndex
CREATE INDEX "Branch_branch_type_idx" ON "Branch"("branch_type");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_warehouse_branch_id_fkey" FOREIGN KEY ("warehouse_branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_from_branch_id_fkey" FOREIGN KEY ("from_branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_to_branch_id_fkey" FOREIGN KEY ("to_branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
