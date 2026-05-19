/*
  Warnings:

  - You are about to drop the column `shift_id` on the `ShiftAssignment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id,start_date]` on the table `ShiftAssignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shift_time` to the `ShiftAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_shift_id_fkey";

-- DropIndex
DROP INDEX "ShiftAssignment_employee_id_shift_id_start_date_key";

-- DropIndex
DROP INDEX "ShiftAssignment_shift_id_idx";

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "code" SET DEFAULT 'CAT-' || gen_random_uuid();

-- AlterTable
ALTER TABLE "ShiftAssignment" DROP COLUMN "shift_id",
ADD COLUMN     "shift_time" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_employee_id_start_date_key" ON "ShiftAssignment"("employee_id", "start_date");
