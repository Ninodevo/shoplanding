import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazy Stripe client. We don't construct at module load so the build / dev
 * server boots without `STRIPE_SECRET_KEY`. The error surfaces only when a
 * caller actually tries to use Stripe — so the marketing site, /playbook,
 * and /showcase keep working in test environments without keys.
 */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local before initiating checkout.",
    );
  }
  cached = new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return cached;
}

export function getStripeWebhookSecret(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Add it to .env.local before exposing the webhook route.",
    );
  }
  return s;
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/** Whether Stripe is configured. UI uses this to gate buy buttons. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type CheckoutTier = "single" | "unlimited" | "setup";
