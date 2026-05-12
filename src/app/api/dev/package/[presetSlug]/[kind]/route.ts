import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  packageThemeArtifact,
  type ArtifactKind,
} from "@/lib/packagers";

const VALID_KINDS = new Set<ArtifactKind>(["spec", "shopify", "woo"]);

/**
 * Dev-only unsigned packager endpoint. No Order, no token, no license — used
 * to inspect what each packager produces directly from a preset slug. Disabled
 * in production via the NODE_ENV check.
 *
 * `/api/dev/package/skincare/spec`     → Orelle's portable spec zip
 * `/api/dev/package/supplement/woo`    → VitalStack's Woo placeholder zip
 * `/api/dev/package/gadget/shopify`    → Aurabud's Shopify placeholder zip
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ presetSlug: string; kind: string }> },
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production." }, { status: 404 });
  }
  const { presetSlug, kind } = await params;
  if (!VALID_KINDS.has(kind as ArtifactKind)) {
    return NextResponse.json({ error: "Unknown artifact kind." }, { status: 404 });
  }

  let artifact;
  try {
    artifact = await packageThemeArtifact({
      presetSlug,
      kind: kind as ArtifactKind,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  return new NextResponse(artifact.bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": artifact.contentType,
      "Content-Length": String(artifact.bytes.byteLength),
      "Content-Disposition": `attachment; filename="${artifact.filename}"`,
    },
  });
}
