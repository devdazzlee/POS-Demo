-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- CreateTable
CREATE TABLE "DeviceIdentity" (
    "fcm_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" TEXT,

    CONSTRAINT "DeviceIdentity_pkey" PRIMARY KEY ("fcm_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceIdentity_customer_id_key" ON "DeviceIdentity"("customer_id");

-- CreateIndex
CREATE INDEX "DeviceIdentity_customer_id_idx" ON "DeviceIdentity"("customer_id");

-- CreateIndex
CREATE INDEX "DeviceIdentity_fcm_token_idx" ON "DeviceIdentity"("fcm_token");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceIdentity_fcm_token_customer_id_key" ON "DeviceIdentity"("fcm_token", "customer_id");

-- AddForeignKey
ALTER TABLE "DeviceIdentity" ADD CONSTRAINT "DeviceIdentity_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
