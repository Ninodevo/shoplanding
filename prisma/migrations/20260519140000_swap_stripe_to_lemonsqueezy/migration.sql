-- Swap Stripe to Lemon Squeezy. Greenfield — orders table verified empty
-- before this migration was written, so the column rename is lossless.

-- 1. Drop Stripe-specific columns from `orders`.
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_stripe_session_id_key";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "stripe_payment_intent_id";

-- 2. Rename `stripe_session_id` → `provider_order_id`, re-add the unique
--    constraint under the new name so the webhook handler can stay
--    idempotent on the LS order ID.
ALTER TABLE "orders" RENAME COLUMN "stripe_session_id" TO "provider_order_id";
CREATE UNIQUE INDEX "orders_provider_order_id_key" ON "orders"("provider_order_id");

-- 3. Add the `provider` column so future processors can coexist with LS
--    without nuking the column or the row history. Defaults to
--    "lemonsqueezy" because LS is the only processor as of this migration.
ALTER TABLE "orders" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'lemonsqueezy';

-- 4. Add `ls_variants` to `themes` — JSONB so per-tier variant IDs live
--    together: { "single": <int>, "unlimited": <int>, "setup": <int> }.
--    Nullable: themes without LS variants disable their buy buttons.
ALTER TABLE "themes" ADD COLUMN "ls_variants" JSONB;
