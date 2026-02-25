-- DropForeignKey
ALTER TABLE "CashFlow" DROP CONSTRAINT "CashFlow_member_id_fkey";

-- AlterTable
ALTER TABLE "CashFlow" ALTER COLUMN "member_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
