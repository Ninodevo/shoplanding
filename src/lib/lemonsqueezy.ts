import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Lazy Lemon Squeezy client. Same pattern as the Stripe wrapper this
 * replaces: doesn't initialize at module load, so the app boots without
 * LS env vars. The error surfaces only when a caller actually tries to
 * hit the LS API — keeping marketing routes alive in dev without keys.
 *
 * Why LS over Stripe (and over a hand-rolled Stripe Connect setup):
 *   - LS is merchant of record, so the Croatian d.o.o. doesn't have to
 *     register for OSS VAT across the EU + UK VAT post-Brexit + US sales
 *     tax nexus across ~30 states for digital products. LS collects and
 *     remits all of that. The ~2% fee premium pays for itself many times
 *     over vs the alternative (accountant fees + filing risk).
 *   - License key issuance is a first-class LS feature — one API call,
 *     not a custom subsystem.
 *   - Webhook signature scheme is identical (HMAC-SHA256) so the
 *     verification code is essentially the same as Stripe's.
 *
 * Setup steps the founder still has to take:
 *   1. Sign up at lemonsqueezy.com, complete KYC (~24h).
 *   2. Create a Store, then one Product per Theme with three Variants
 *      (single / unlimited / setup).
 *   3. Set `ls_variants` on each Theme row to map { single, unlimited,
 *      setup } → LS variant IDs (UI gates buy buttons on this being set).
 *   4. Drop API key, store ID, webhook secret in .env.local + Vercel.
 *   5. Add this app's webhook URL in LS dashboard:
 *      `https://shoplanding.io/api/lemonsqueezy/webhook`, sign with the
 *      same secret, subscribe to `order_created` (plus `subscription_*`
 *      events when the audit Pro tier ships).
 */

let _initialized = false;

function ensureInit() {
  if (_initialized) return;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LEMONSQUEEZY_API_KEY is not set. Add it to .env.local before initiating checkout.",
    );
  }
  lemonSqueezySetup({
    apiKey,
    onError: (err) => {
      console.warn("[lemonsqueezy] SDK error", err);
    },
  });
  _initialized = true;
}

export function isLemonSqueezyConfigured(): boolean {
  return Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
}

export function getLemonSqueezyStoreId(): string {
  const s = process.env.LEMONSQUEEZY_STORE_ID;
  if (!s) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not set.");
  }
  return s;
}

export function getLemonSqueezyWebhookSecret(): string {
  const s = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!s) {
    throw new Error(
      "LEMONSQUEEZY_WEBHOOK_SECRET is not set. Add it to .env.local before exposing the webhook route.",
    );
  }
  return s;
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000"
  );
}

export type CheckoutTier = "single" | "unlimited" | "setup";

/**
 * Per-tier LS variant IDs stored on Theme.lsVariants. Either all three are
 * set (theme is buyable) or the field is null (buy buttons disabled).
 */
export type ThemeLsVariants = {
  single: number;
  unlimited: number;
  setup: number;
};

export function asThemeLsVariants(v: unknown): ThemeLsVariants | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.single === "number" &&
    typeof o.unlimited === "number" &&
    typeof o.setup === "number"
  ) {
    return { single: o.single, unlimited: o.unlimited, setup: o.setup };
  }
  return null;
}

/**
 * Create a one-shot checkout URL for a (variant, tier) pair and embed our
 * own metadata so the webhook can mint the Order row without round-tripping
 * to a separate Stripe-style "session lookup".
 */
export async function createLemonCheckoutUrl(args: {
  variantId: number;
  themeId: string;
  themeSlug: string;
  tier: CheckoutTier;
  successUrl: string;
  prefilledEmail?: string;
}): Promise<string> {
  ensureInit();
  const storeId = getLemonSqueezyStoreId();

  const res = await createCheckout(storeId, args.variantId, {
    checkoutData: {
      email: args.prefilledEmail,
      custom: {
        themeId: args.themeId,
        themeSlug: args.themeSlug,
        tier: args.tier,
      },
    },
    productOptions: {
      redirectUrl: args.successUrl,
      // Sane defaults that match the old Stripe checkout flow's vibe.
      enabledVariants: [args.variantId],
    },
    checkoutOptions: {
      embed: false,
      media: false,
      logo: true,
    },
  });

  if (res.error) {
    throw new Error(
      `Lemon Squeezy createCheckout failed: ${JSON.stringify(res.error)}`,
    );
  }
  const url = res.data?.data?.attributes?.url;
  if (!url) {
    throw new Error("Lemon Squeezy returned no checkout URL.");
  }
  return url;
}

/**
 * HMAC-SHA256 verification of a Lemon Squeezy webhook payload. LS sends
 * the signature in `X-Signature` and the signing key is the webhook secret
 * (NOT the API key). Same scheme as Stripe's webhook signing, just a
 * different header name.
 */
export function verifyLemonSqueezySignature(args: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}): boolean {
  if (!args.signatureHeader) return false;
  const expected = createHmac("sha256", args.secret)
    .update(args.rawBody, "utf8")
    .digest("hex");
  const provided = args.signatureHeader.trim();
  // Length-mismatch comparison would short-circuit and leak timing info,
  // so we route through timingSafeEqual on padded buffers.
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(provided, "hex"),
    );
  } catch {
    return false;
  }
}
