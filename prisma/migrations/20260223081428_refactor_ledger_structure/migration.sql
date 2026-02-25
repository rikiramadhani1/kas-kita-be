/*
  Warnings:

  - You are about to drop the column `amount` on the `CashFlow` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `CashFlow` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `CashFlow` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `CashFlow` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[member_id,month,year]` on the table `CashFlow` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `member_id` to the `CashFlow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `CashFlow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `CashFlow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `CashFlow` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_member_id_month_year_key";

-- AlterTable
ALTER TABLE "CashFlow" DROP COLUMN "amount",
DROP COLUMN "description",
DROP COLUMN "source",
DROP COLUMN "type",
ADD COLUMN     "member_id" INTEGER NOT NULL,
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "total_amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CashFlow_member_id_month_year_key" ON "CashFlow"("member_id", "month", "year");

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
