-- CreateTable
CREATE TABLE "rendered_blocks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "placement" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "satisfies" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rendered_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rendered_blocks_slug_key" ON "rendered_blocks"("slug");

-- CreateIndex
CREATE INDEX "rendered_blocks_position_idx" ON "rendered_blocks"("position");
