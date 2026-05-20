/**
 * Link Lemon Squeezy products → DB themes, and create the webhook if absent.
 *
 * Run AFTER you've created the 3 products in the LS dashboard (one per
 * theme, each with three variants priced 99 / 249 / 199 in the store
 * currency).
 *
 * What it does:
 *   1. Fetches every product + variant in the configured store
 *   2. Fuzzy-matches each Product → Theme by name keyword (skincare /
 *      supplement / gadget — whichever your product name contains)
 *   3. For each matched product, maps the 3 variants to tiers BY PRICE:
 *        99 → single, 249 → unlimited, 199 → setup
 *   4. Writes the resulting { single, unlimited, setup } mapping to
 *      Theme.lsVariants. UI gates buy buttons on this column.
 *   5. Creates a webhook pointing to {webhookUrl}/api/lemonsqueezy/webhook
 *      if one doesn't already exist, signed with LEMONSQUEEZY_WEBHOOK_SECRET
 *      and subscribed to `order_created`.
 *
 * Usage:
 *   npx tsx scripts/lemonsqueezy-link.ts                       # uses NEXT_PUBLIC_SITE_URL
 *   npx tsx scripts/lemonsqueezy-link.ts https://example.com   # explicit base URL
 *
 * Re-runnable: writes are upserts in spirit, webhook creation is skipped
 * if one already exists for the URL.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import {
  lemonSqueezySetup,
  listProducts,
  listVariants,
  listWebhooks,
  createWebhook,
} from "@lemonsqueezy/lemonsqueezy.js";
import { getPrisma } from "../src/lib/db";

const TIER_PRICE: Record<"single" | "unlimited" | "setup", number> = {
  single: 9900,
  unlimited: 24900,
  setup: 19900,
};

// Theme slug → keyword we expect to find in the LS product name.
const THEME_KEYWORD: Record<string, RegExp> = {
  "skincare-orelle": /skincare|orelle/i,
  "supplement-vitalstack": /supplement|vitalstack/i,
  "gadget-aurabud": /gadget|aurabud/i,
};

async function main() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!apiKey || !storeId) {
    console.error("Missing LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID in .env.local");
    process.exit(1);
  }
  lemonSqueezySetup({ apiKey });

  const baseUrl = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "")
    .replace(/\/$/, "");
  if (!baseUrl) {
    console.error("Pass a public base URL as the first arg, or set NEXT_PUBLIC_SITE_URL.");
    process.exit(1);
  }
  const webhookUrl = `${baseUrl}/api/lemonsqueezy/webhook`;
  const isLocal = /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/i.test(baseUrl);

  console.log(`→ Fetching products + variants in store ${storeId} …`);
  const products = await listProducts({ filter: { storeId: Number(storeId) } });
  if (products.error || !products.data) {
    console.error("listProducts failed:", products.error);
    process.exit(1);
  }
  const productRows = products.data.data ?? [];
  if (productRows.length === 0) {
    console.error("\n❌ No products found in the store.");
    console.error("   Create them in the LS dashboard first, then re-run this script.");
    console.error("   Instructions: see Phase 12 in docs/roadmap.md.");
    process.exit(1);
  }

  // ── 1. Pull all variants up-front so we can match independently of product order
  type V = { id: string; productId: string; name: string; price: number };
  const allVariants: V[] = [];
  for (const p of productRows) {
    const vRes = await listVariants({ filter: { productId: Number(p.id) } });
    for (const v of vRes.data?.data ?? []) {
      allVariants.push({
        id: v.id,
        productId: String(p.id),
        name: v.attributes.name,
        price: v.attributes.price,
      });
    }
  }
  console.log(`  fetched ${productRows.length} product(s), ${allVariants.length} variant(s) total`);

  // ── 2. Match products to themes
  const prisma = getPrisma();
  const themes = await prisma.theme.findMany({ select: { id: true, slug: true, name: true } });

  let linkedCount = 0;
  let warnings = 0;
  for (const theme of themes) {
    const pattern = THEME_KEYWORD[theme.slug];
    if (!pattern) {
      console.warn(`  · Theme '${theme.slug}' has no keyword pattern in the script — skipping.`);
      continue;
    }
    const product = productRows.find((p) => pattern.test(p.attributes.name));
    if (!product) {
      console.warn(`  ⚠ No LS product matches theme '${theme.slug}' (looking for /${pattern.source}/)`);
      warnings++;
      continue;
    }
    const variantsForProduct = allVariants.filter((v) => v.productId === String(product.id));

    const mapping: Partial<Record<"single" | "unlimited" | "setup", number>> = {};
    for (const [tier, cents] of Object.entries(TIER_PRICE) as Array<["single" | "unlimited" | "setup", number]>) {
      const match = variantsForProduct.find((v) => v.price === cents);
      if (match) {
        mapping[tier] = Number(match.id);
      } else {
        console.warn(`  ⚠ Theme '${theme.slug}' / product '${product.attributes.name}': no variant at ${cents / 100}.`);
        console.warn(`     Available: ${variantsForProduct.map((v) => `${v.name}=${v.price / 100}`).join(", ")}`);
        warnings++;
      }
    }

    if (mapping.single && mapping.unlimited && mapping.setup) {
      await prisma.theme.update({
        where: { id: theme.id },
        data: { lsVariants: mapping },
      });
      console.log(`  ✓ Linked '${theme.slug}' → product ${product.id} (variants: single=${mapping.single}, unlimited=${mapping.unlimited}, setup=${mapping.setup})`);
      linkedCount++;
    }
  }

  console.log(`\n→ Linked ${linkedCount} / ${themes.length} themes${warnings ? ` (${warnings} warning(s))` : ""}`);

  // ── 3. Webhook
  console.log(`\n→ Checking webhooks for ${webhookUrl} …`);
  if (isLocal) {
    console.warn(`  ⚠ Base URL is localhost — LS can't reach it. Skipping webhook creation.`);
    console.warn(`    Deploy to Vercel (or use ngrok) and re-run with the public URL:`);
    console.warn(`      npx tsx scripts/lemonsqueezy-link.ts https://yourdomain.com`);
  } else if (!webhookSecret) {
    console.warn(`  ⚠ LEMONSQUEEZY_WEBHOOK_SECRET not set — skipping webhook creation.`);
  } else {
    const hooks = await listWebhooks({ filter: { storeId: Number(storeId) } });
    const existing = (hooks.data?.data ?? []).find(
      (h) => h.attributes.url === webhookUrl,
    );
    if (existing) {
      console.log(`  ✓ Webhook already exists (id ${existing.id})`);
    } else {
      const created = await createWebhook(Number(storeId), {
        url: webhookUrl,
        events: ["order_created"],
        secret: webhookSecret,
      });
      if (created.error) {
        console.error(`  ✗ createWebhook failed:`, created.error);
      } else {
        console.log(`  ✓ Created webhook ${created.data?.data?.id} → ${webhookUrl}`);
      }
    }
  }

  console.log(`\nDone.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
