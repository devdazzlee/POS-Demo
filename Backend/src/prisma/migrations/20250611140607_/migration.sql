-- DropIndex
DROP INDEX "DeviceIdentity_fcm_token_key";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();
