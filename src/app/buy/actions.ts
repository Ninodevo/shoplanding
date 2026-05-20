"use server";

import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import {
  asThemeLsVariants,
  createLemonCheckoutUrl,
  getSiteUrl,
  type CheckoutTier,
} from "@/lib/lemonsqueezy";

const TIER_PRICE_FIELD = {
  single: "priceSingleCents",
  unlimited: "priceUnlimitedCents",
  setup: "setupAddOnCents",
} as const satisfies Record<CheckoutTier, string>;

/**
 * Server action invoked by the buy buttons on /themes/[slug].
 *
 * Resolves the Theme + its LS variant ID for the requested tier, asks Lemon
 * Squeezy for a hosted checkout URL with our metadata attached (themeId /
 * themeSlug / tier), and `redirect`s the browser straight there. The
 * webhook handler in /api/lemonsqueezy/webhook is the source of truth for
 * Order creation — this action just gets the buyer to the checkout.
 *
 * Failure surfaces:
 *   - Unknown tier or theme → thrown error
 *   - Theme has no `lsVariants` yet → human-readable error so the dev
 *     knows they forgot to populate the JSON column for that theme
 *   - LS API fails → bubble the LS error so we can debug
 */
export async function createCheckoutSession(formData: FormData) {
  const themeSlug = String(formData.get("themeSlug") ?? "").trim();
  const rawTier = String(formData.get("tier") ?? "").trim() as CheckoutTier;

  if (!themeSlug || !(rawTier in TIER_PRICE_FIELD)) {
    throw new Error("Invalid checkout request: missing themeSlug or tier.");
  }

  const prisma = getPrisma();
  const theme = await prisma.theme.findUnique({
    where: { slug: themeSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      lsVariants: true,
      published: true,
    },
  });
  if (!theme || !theme.published) {
    throw new Error(`Theme '${themeSlug}' not found or not published.`);
  }

  const variants = asThemeLsVariants(theme.lsVariants);
  if (!variants) {
    throw new Error(
      `Theme '${theme.slug}' has no Lemon Squeezy variants configured. Update theme.lsVariants in the DB with { single, unlimited, setup } variant IDs from the LS dashboard.`,
    );
  }
  const variantId = variants[rawTier];

  const siteUrl = getSiteUrl();
  // LS redirects here on success; the success page looks up the order by
  // providerOrderId, which LS appends as a query string.
  const successUrl = `${siteUrl}/buy/success`;

  const checkoutUrl = await createLemonCheckoutUrl({
    variantId,
    themeId: theme.id,
    themeSlug: theme.slug,
    tier: rawTier,
    successUrl,
  });

  redirect(checkoutUrl);
}
