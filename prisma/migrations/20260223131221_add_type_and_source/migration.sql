/*
  Warnings:

  - Added the required column `source` to the `CashFlow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `CashFlow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CashFlow" ADD COLUMN     "description" TEXT,
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
