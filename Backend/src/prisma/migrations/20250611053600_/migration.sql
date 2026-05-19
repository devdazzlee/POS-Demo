/*
  Warnings:

  - Made the column `email` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
