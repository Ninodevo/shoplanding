import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import LandingRenderer from "@/components/landing/LandingRenderer";
import TweaksPanel from "@/components/landing/TweaksPanel";
import type {
  LandingContent,
  LandingTokens,
  LandingTweaks,
} from "@/components/landing/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const { previewSlug } = await params;
  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { previewSlug },
    include: { theme: { include: { preset: true } } },
  });
  if (!order) return { title: "Preview — ShopLanding", robots: { index: false } };
  const seed = order.theme.preset.demoSeed as unknown as LandingContent;
  return {
    title: `${order.theme.name} — buyer preview`,
    description: `Personalized preview for ${seed.product.title}.`,
    robots: { index: false, follow: false },
  };
}

/**
 * `/preview/[previewSlug]` — the buyer's personalized live preview.
 *
 * The slug is the unguessable shared secret. Anyone with the URL can edit the
 * tweaks (by design — the buyer can hand the URL to a designer), but they
 * can't enumerate slugs. When auth lands in Phase 7, signed-in account
 * ownership wins over slug-only access.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const { previewSlug } = await params;
  const prisma = getPrisma();

  const order = await prisma.order.findUnique({
    where: { previewSlug },
    include: { theme: { include: { preset: true } } },
  });
  if (!order) notFound();

  const tokens = order.theme.preset.tokens as unknown as LandingTokens;
  const content = order.theme.preset.demoSeed as unknown as LandingContent;
  const tweaks = (order.tweaks as LandingTweaks | null) ?? {};

  return (
    <>
      <Ribbon name={order.theme.name} licenseKey={order.licenseKey} />
      <LandingRenderer content={content} tokens={tokens} tweaks={tweaks} />
      <TweaksPanel
        initialTokens={tokens}
        initialTweaks={tweaks}
        previewSlug={previewSlug}
        mode="persisted"
      />
    </>
  );
}

function Ribbon({
  name,
  licenseKey,
}: {
  name: string;
  licenseKey: string | null;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 9999,
        display: "inline-flex",
        gap: 12,
        alignItems: "center",
        padding: "8px 14px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        border: "1px solid #e5e5e8",
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#3a3a40",
      }}
    >
      <Link href="/" style={{ color: "inherit" }}>
        ← ShopLanding
      </Link>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ color: "#0a0a0a", fontWeight: 600 }}>{name} preview</span>
      {licenseKey && (
        <>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ color: "#807868" }}>{licenseKey}</span>
        </>
      )}
    </div>
  );
}
