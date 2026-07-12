-- Deep audit (paid, rendered-browser pass) columns on audits
ALTER TABLE "audits" ADD COLUMN "deep_order_id" TEXT;
ALTER TABLE "audits" ADD COLUMN "deep_paid_at" TIMESTAMP(3);
ALTER TABLE "audits" ADD COLUMN "deep_started_at" TIMESTAMP(3);
ALTER TABLE "audits" ADD COLUMN "deep_completed_at" TIMESTAMP(3);
ALTER TABLE "audits" ADD COLUMN "deep_result" JSONB;
ALTER TABLE "audits" ADD COLUMN "deep_error" TEXT;
CREATE UNIQUE INDEX "audits_deep_order_id_key" ON "audits"("deep_order_id");
