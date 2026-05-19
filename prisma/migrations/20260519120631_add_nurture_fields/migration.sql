-- AlterTable
ALTER TABLE "audits" ADD COLUMN     "nurture_day3_sent_at" TIMESTAMP(3),
ADD COLUMN     "nurture_day7_sent_at" TIMESTAMP(3),
ADD COLUMN     "unlock_email_sent_at" TIMESTAMP(3),
ADD COLUMN     "unlocked_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "audits_unlocked_at_idx" ON "audits"("unlocked_at");
