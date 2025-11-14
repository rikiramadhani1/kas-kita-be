/*
  Warnings:

  - You are about to drop the column `user_id` on the `UserActivity` table. All the data in the column will be lost.
  - Added the required column `member_id` to the `UserActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserActivity" DROP COLUMN "user_id",
ADD COLUMN     "member_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "LogSignTf" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogSignTf_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogSignTf" ADD CONSTRAINT "LogSignTf_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
