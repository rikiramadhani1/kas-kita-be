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
ALTER TABLE "LogSignTf" ADD CONSTRAINT "LogSignTf_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
