/*
  Warnings:

  - You are about to drop the `Refund` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefundItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'EXCHANGED';

-- DropForeignKey
ALTER TABLE "Refund" DROP CONSTRAINT "Refund_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "RefundItem" DROP CONSTRAINT "RefundItem_refund_id_fkey";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- DropTable
DROP TABLE "Refund";

-- DropTable
DROP TABLE "RefundItem";
