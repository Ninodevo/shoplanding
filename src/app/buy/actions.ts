"use server";

import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { getStripe, getSiteUrl, type CheckoutTier } from "@/lib/stripe";

const TIER_LABEL: Record<CheckoutTier, string> = {
  single: "Single-store license",
  unlimited: "Unlimited-stores license",
  setup: "Done-for-you setup add-on",
};

const TIER_PRICE_FIELD = {
  single: "priceSingleCents",
  unlimited: "priceUnlimitedCents",
  setup: "setupAddOnCents",
} as const satisfies Record<CheckoutTier, string>;

/**
 * Server action invoked by the buy buttons on /themes/[slug].
 *
 * Builds a one-shot Stripe Checkout Session in payment mode (one-time license),
 * stores `themeSlug` and `tier` in metadata so the webhook can mint the Order
 * row + license key without round-tripping to the DB during the redirect.
 *
 * The redirect to `session.url` happens via `redirect()` so the user
 * never sees the action's response — the browser jumps straight to Stripe.
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
      tagline: true,
      priceSingleCents: true,
      priceUnlimitedCents: true,
      setupAddOnCents: true,
      published: true,
    },
  });
  if (!theme || !theme.published) {
    throw new Error(`Theme '${themeSlug}' not found or not published.`);
  }

  const amountCents = theme[TIER_PRICE_FIELD[rawTier]];
  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `${theme.name} — ${TIER_LABEL[rawTier]}`,
            description: theme.tagline,
            metadata: { themeSlug: theme.slug, tier: rawTier },
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      themeSlug: theme.slug,
      themeId: theme.id,
      tier: rawTier,
    },
    success_url: `${siteUrl}/buy/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/themes/${theme.slug}?canceled=1`,
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    customer_creation: "always",
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }
  redirect(session.url);
}
