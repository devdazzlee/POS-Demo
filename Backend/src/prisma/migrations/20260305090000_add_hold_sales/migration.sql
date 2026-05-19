-- CreateTable
CREATE TABLE "HoldSale" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "created_by" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoldSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HoldSale" ADD CONSTRAINT "HoldSale_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoldSale" ADD CONSTRAINT "HoldSale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoldSale" ADD CONSTRAINT "HoldSale_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "HoldSale_branch_id_idx" ON "HoldSale"("branch_id");
CREATE INDEX "HoldSale_customer_id_idx" ON "HoldSale"("customer_id");
CREATE INDEX "HoldSale_created_by_idx" ON "HoldSale"("created_by");
CREATE INDEX "HoldSale_created_at_idx" ON "HoldSale"("created_at");
