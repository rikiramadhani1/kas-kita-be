/*
  Warnings:

  - A unique constraint covering the columns `[member_id,month,year]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_member_id_month_year_key" ON "Payment"("member_id", "month", "year");
