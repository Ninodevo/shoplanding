-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "email" TEXT,
    "raw_result" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'free',
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audits_created_at_idx" ON "audits"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audits_url_idx" ON "audits"("url");
