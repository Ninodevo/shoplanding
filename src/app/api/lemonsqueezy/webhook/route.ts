import { type NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import {
  getLemonSqueezyWebhookSecret,
  verifyLemonSqueezySignature,
  type CheckoutTier,
} from "@/lib/lemonsqueezy";
import { generateLicenseKey, generatePreviewSlug } from "@/lib/license";

/**
 * Lemon Squeezy webhook endpoint.
 *
 * LS POSTs `/api/lemonsqueezy/webhook` with a JSON body and an
 * `X-Signature` header (HMAC-SHA256 of the raw body, signed with the
 * webhook secret). We verify the signature, then dispatch on
 * `meta.event_name`. The only event we mint Orders from is
 * `order_created`; refunds + disputes get a 200 ack today and we grow
 * the switch when those flows matter.
 *
 * Read the raw body via `request.text()` — JSON.parse would normalise
 * whitespace and break the signature comparison, same as the Stripe
 * version this replaced.
 */
export async function POST(request: NextRequest) {
  const sig = request.headers.get("x-signature");
  const raw = await request.text();

  let secret: string;
  try {
    secret = getLemonSqueezyWebhookSecret();
  } catch {
    return NextResponse.json(
      { error: "LEMONSQUEEZY_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }

  if (!verifyLemonSqueezySignature({ rawBody: raw, signatureHeader: sig, secret })) {
    return NextResponse.json(
      { error: "Signature verification failed." },
      { status: 401 },
    );
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(raw) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventName = payload?.meta?.event_name;

  try {
    switch (eventName) {
      case "order_created":
        await handleOrderCreated(payload);
        break;
      default:
        // 200 so LS stops retrying — subscription/refund/dispute will land
        // here once we add tiers + service guarantees.
        break;
    }
  } catch (err) {
    console.error("[lemonsqueezy webhook] handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler error." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// ── Types for the slice of the LS webhook payload we use ───────────────
//
// LS sends a JSON:API-flavoured shape. We type only the fields we touch
// rather than pulling in their full SDK types — keeps the surface tiny
// and means we don't have to chase SDK version bumps.
type LemonWebhookPayload = {
  meta: {
    event_name: string;
    custom_data?: Record<string, string>;
  };
  data: {
    id: string; // The LS order ID — used as providerOrderId.
    attributes: {
      user_email?: string;
      customer_id?: number;
      total?: number; // cents
      currency?: string;
      first_order_item?: {
        variant_id?: number;
        product_id?: number;
        price?: number;
      };
    };
  };
};

async function handleOrderCreated(payload: LemonWebhookPayload) {
  const prisma = getPrisma();
  const orderId = payload.data?.id;
  if (!orderId) {
    throw new Error("order_created payload missing data.id");
  }

  // Idempotency: if we've already created an Order for this LS order, exit.
  // LS retries on 5xx so this guard matters.
  const existing = await prisma.order.findUnique({
    where: { providerOrderId: orderId },
    select: { id: true },
  });
  if (existing) return;

  const custom = payload.meta?.custom_data ?? {};
  const themeId = custom.themeId;
  const themeSlug = custom.themeSlug;
  const tier = custom.tier as CheckoutTier | undefined;

  if (!themeId || !themeSlug || !tier) {
    throw new Error(
      `LS order ${orderId} is missing themeId / themeSlug / tier custom_data. Check the createCheckout call.`,
    );
  }

  const email = payload.data.attributes?.user_email;
  if (!email) {
    throw new Error(
      `LS order ${orderId} has no buyer email — cannot create Order row.`,
    );
  }

  const amountCents = payload.data.attributes?.total ?? 0;
  const currency = (payload.data.attributes?.currency ?? "USD").toUpperCase();

  await prisma.order.create({
    data: {
      // Until /account auth fully owns this, the email is the userId.
      // Neon Auth ties the email to a user row on first sign-in, and
      // /account/downloads already matches orders by email for legacy
      // pre-auth purchases.
      userId: email,
      themeId,
      tier,
      amountCents,
      currency,
      provider: "lemonsqueezy",
      providerOrderId: orderId,
      status: "paid",
      licenseKey: generateLicenseKey(),
      previewSlug: generatePreviewSlug(),
    },
  });
}
