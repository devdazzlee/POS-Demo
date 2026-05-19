/*
  Warnings:

  - The primary key for the `DeviceIdentity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[fcm_token]` on the table `DeviceIdentity` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `DeviceIdentity` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "DeviceIdentity" DROP CONSTRAINT "DeviceIdentity_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "DeviceIdentity_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceIdentity_fcm_token_key" ON "DeviceIdentity"("fcm_token");
