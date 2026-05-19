-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "ordered_quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "received_quantity" SET DEFAULT 0,
ALTER COLUMN "received_quantity" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SaleItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Stock" ALTER COLUMN "current_quantity" SET DEFAULT 0,
ALTER COLUMN "current_quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "reserved_quantity" SET DEFAULT 0,
ALTER COLUMN "reserved_quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "minimum_quantity" SET DEFAULT 0,
ALTER COLUMN "minimum_quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "maximum_quantity" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "reorder_level" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "quantity_change" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "previous_qty" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "new_qty" SET DATA TYPE DECIMAL(65,30);
