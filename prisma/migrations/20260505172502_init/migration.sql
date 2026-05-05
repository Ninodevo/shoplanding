-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "must_include" JSONB NOT NULL,
    "pitfalls" JSONB NOT NULL,
    "checklist_refs" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "layout_presets" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "tokens" JSONB NOT NULL,
    "demo_seed" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "layout_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preset_blocks" (
    "id" TEXT NOT NULL,
    "preset_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "overrides" JSONB,

    CONSTRAINT "preset_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "themes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "preset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "shopify_zip_url" TEXT,
    "woo_zip_url" TEXT,
    "system_spec_url" TEXT,
    "price_single_cents" INTEGER NOT NULL,
    "price_unlimited_cents" INTEGER NOT NULL,
    "setup_add_on_cents" INTEGER NOT NULL,
    "screenshots" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stripe_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "license_key" TEXT,
    "tweaks" JSONB,
    "preview_slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocks_slug_key" ON "blocks"("slug");

-- CreateIndex
CREATE INDEX "blocks_category_sort_order_idx" ON "blocks"("category", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "layout_presets_slug_key" ON "layout_presets"("slug");

-- CreateIndex
CREATE INDEX "preset_blocks_preset_id_idx" ON "preset_blocks"("preset_id");

-- CreateIndex
CREATE UNIQUE INDEX "preset_blocks_preset_id_position_key" ON "preset_blocks"("preset_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "themes_slug_key" ON "themes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripe_session_id_key" ON "orders"("stripe_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_license_key_key" ON "orders"("license_key");

-- CreateIndex
CREATE UNIQUE INDEX "orders_preview_slug_key" ON "orders"("preview_slug");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_theme_id_idx" ON "orders"("theme_id");

-- AddForeignKey
ALTER TABLE "preset_blocks" ADD CONSTRAINT "preset_blocks_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "layout_presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_blocks" ADD CONSTRAINT "preset_blocks_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "themes" ADD CONSTRAINT "themes_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "layout_presets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
