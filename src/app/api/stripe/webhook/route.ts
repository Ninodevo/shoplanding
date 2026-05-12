import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getPrisma } from "@/lib/db";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import {
  generateLicenseKey,
  generatePreviewSlug,
} from "@/lib/license";

/**
 * Stripe webhook endpoint.
 *
 * Stripe → POST `/api/stripe/webhook` with a signed body. We verify the
 * signature, then handle `checkout.session.completed` by minting an `Order`
 * row with a license key and a preview slug.
 *
 * Other event types are 200'd as no-ops so Stripe doesn't retry them; we'll
 * grow the switch as needed (refunds, disputes, async-payment_succeeded for
 * delayed payment methods like Klarna).
 *
 * The route reads the raw body via `request.text()` because Stripe's
 * signature is computed against the raw bytes — JSON.parse would not match.
 */
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 },
    );
  }

  const raw = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      getStripeWebhookSecret(),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[stripe webhook] signature verification failed:", msg);
    return NextResponse.json(
      { error: `Signature verification failed: ${msg}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      default:
        // Acknowledge other events so Stripe stops retrying. We grow the
        // switch as new event types become relevant (refund / dispute / etc).
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler error." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const prisma = getPrisma();

  // Idempotency: if we've already created an Order for this session, exit.
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (existing) return;

  const themeId = session.metadata?.themeId;
  const themeSlug = session.metadata?.themeSlug;
  const tier = session.metadata?.tier;
  if (!themeId || !themeSlug || !tier) {
    throw new Error(
      `Stripe session ${session.id} is missing themeId/themeSlug/tier metadata.`,
    );
  }

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    null;
  if (!email) {
    throw new Error(
      `Stripe session ${session.id} has no buyer email — cannot create Order.`,
    );
  }

  const amountCents = session.amount_total ?? 0;
  const currency = (session.currency ?? "usd").toUpperCase();

  await prisma.order.create({
    data: {
      // Until auth lands in Phase 7, the buyer's email IS the userId.
      // We resolve email → User row when we add @neondatabase/auth.
      userId: email,
      themeId,
      tier,
      amountCents,
      currency,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      status: "paid",
      licenseKey: generateLicenseKey(),
      previewSlug: generatePreviewSlug(),
    },
  });
}
