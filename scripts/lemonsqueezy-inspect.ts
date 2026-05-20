/**
 * Read-only inspector for the configured Lemon Squeezy store. Prints what's
 * there so the next script (linker) knows whether to wait for the founder
 * to create products in the dashboard or whether to proceed to mapping.
 *
 * Run: npx tsx scripts/lemonsqueezy-inspect.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import {
  lemonSqueezySetup,
  getAuthenticatedUser,
  getStore,
  listProducts,
  listVariants,
  listWebhooks,
} from "@lemonsqueezy/lemonsqueezy.js";

async function main() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) {
    console.error("Missing LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID in .env.local");
    process.exit(1);
  }
  lemonSqueezySetup({ apiKey });

  console.log("→ Verifying API key …");
  const me = await getAuthenticatedUser();
  if (me.error || !me.data) {
    console.error("Auth failed:", me.error);
    process.exit(1);
  }
  const user = me.data.data?.attributes;
  console.log(`  ✓ Authenticated as ${user?.name} <${user?.email}>`);

  console.log(`\n→ Fetching store ${storeId} …`);
  const storeRes = await getStore(storeId);
  if (storeRes.error || !storeRes.data) {
    console.error("getStore failed:", storeRes.error);
    process.exit(1);
  }
  const store = storeRes.data.data?.attributes;
  console.log(`  ✓ Store: ${store?.name} (${store?.url}) · currency ${store?.currency}`);

  console.log(`\n→ Listing products in store …`);
  const products = await listProducts({ filter: { storeId: Number(storeId) } });
  if (products.error) {
    console.error("listProducts failed:", products.error);
    process.exit(1);
  }
  const productRows = products.data?.data ?? [];
  if (productRows.length === 0) {
    console.log("  (no products yet — you'll create them in the dashboard, see below)");
  } else {
    for (const p of productRows) {
      const a = p.attributes;
      console.log(`  • Product ${p.id}: "${a.name}" — status=${a.status}, price=${a.price_formatted}`);
      const variants = await listVariants({ filter: { productId: Number(p.id) } });
      const variantRows = variants.data?.data ?? [];
      for (const v of variantRows) {
        const va = v.attributes;
        console.log(`      └─ Variant ${v.id}: "${va.name}" — ${va.price / 100} ${store?.currency ?? ""} (status=${va.status})`);
      }
    }
  }

  console.log(`\n→ Listing webhooks for store …`);
  const hooks = await listWebhooks({ filter: { storeId: Number(storeId) } });
  if (hooks.error) {
    console.error("listWebhooks failed:", hooks.error);
  } else {
    const hookRows = hooks.data?.data ?? [];
    if (hookRows.length === 0) {
      console.log("  (no webhooks yet — we'll create one via API once products exist)");
    } else {
      for (const h of hookRows) {
        const a = h.attributes;
        console.log(`  • Webhook ${h.id}: ${a.url} — events: ${(a.events ?? []).join(", ")}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
