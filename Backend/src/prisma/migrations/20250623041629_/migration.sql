/*
  Warnings:

  - Added the required column `password` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "password" TEXT NOT NULL;
