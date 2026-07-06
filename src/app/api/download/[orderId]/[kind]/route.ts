import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import {
  packageThemeArtifact,
  type ArtifactKind,
} from "@/lib/packagers";
import {
  verifyDownloadToken,
  type DownloadKind,
} from "@/lib/download-token";

// "woo" is deliberately absent — its packager still emits a placeholder.
// Re-add when the real WooCommerce emitter ships (see DELIVERABLE_ARTIFACT_KINDS).
const VALID_KINDS = new Set<ArtifactKind>(["spec", "shopify"]);

/**
 * Signed download endpoint.
 *
 * Buyers get URLs like:
 *   /api/download/<orderId>/<kind>?token=<signed-token>
 *
 * The token is HMAC'd with the order's license key; expiry baked in. We:
 *  1. Look up the order (must be paid).
 *  2. Verify the token signature against the order's license key.
 *  3. Verify path params match the token's claimed (orderId, kind).
 *  4. Build the artifact on-demand from the linked preset + the order's tweaks.
 *  5. Stream the zip with Content-Disposition: attachment.
 *
 * Build-on-demand keeps storage free; cache-control headers below encourage
 * upstream CDNs to cache by URL once we put a CDN in front. Tokens are stable
 * per (orderId, kind, expiry) so cache hits work for the lifetime of a token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; kind: string }> },
) {
  const { orderId, kind } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }
  if (!VALID_KINDS.has(kind as ArtifactKind)) {
    return NextResponse.json({ error: "Unknown artifact kind." }, { status: 404 });
  }

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { theme: { include: { preset: true } } },
  });
  if (!order || !order.licenseKey) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "paid") {
    return NextResponse.json(
      { error: `Order is not paid (status: ${order.status}).` },
      { status: 403 },
    );
  }

  const decoded = verifyDownloadToken({
    token,
    licenseKey: order.licenseKey,
  });
  if (!decoded) {
    return NextResponse.json(
      { error: "Token invalid or expired." },
      { status: 401 },
    );
  }
  if (decoded.orderId !== order.id || decoded.kind !== (kind as DownloadKind)) {
    return NextResponse.json(
      { error: "Token does not match this URL." },
      { status: 401 },
    );
  }

  const artifact = await packageThemeArtifact({
    presetSlug: order.theme.preset.slug,
    kind: kind as ArtifactKind,
    tweaks: (order.tweaks as object | null) ?? undefined,
    licenseKey: order.licenseKey,
    version: order.theme.version,
  });

  return new NextResponse(artifact.bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": artifact.contentType,
      "Content-Length": String(artifact.bytes.byteLength),
      "Content-Disposition": `attachment; filename="${artifact.filename}"`,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
