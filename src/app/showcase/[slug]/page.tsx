import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import LandingRenderer from "@/components/landing/LandingRenderer";
import TweaksPanel from "@/components/landing/TweaksPanel";
import type {
  LandingContent,
  LandingTokens,
} from "@/components/landing/types";

export const revalidate = 600;

export async function generateStaticParams() {
  const prisma = getPrisma();
  const rows = await prisma.layoutPreset.findMany({ select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prisma = getPrisma();
  const preset = await prisma.layoutPreset.findUnique({ where: { slug } });
  if (!preset) return { title: "Showcase — ShopLanding" };
  const seed = preset.demoSeed as unknown as LandingContent;
  return {
    title: `${preset.name} — ShopLanding ${preset.niche.toLowerCase()} showcase`,
    description: `Live demo: ${seed.product.title}. Rendered from the same component tree the buyer downloads.`,
    robots: { index: false, follow: true },
  };
}

export default async function ShowcaseSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const embedded = sp.embed === "1";
  const prisma = getPrisma();
  const preset = await prisma.layoutPreset.findUnique({ where: { slug } });
  if (!preset) notFound();

  const tokens = preset.tokens as unknown as LandingTokens;
  const content = preset.demoSeed as unknown as LandingContent;

  // Embed mode strips the ribbon + tweaks panel so the page can live inside
  // an iframe on /themes/[slug] as a "look at what you're buying" preview.
  if (embedded) {
    return <LandingRenderer content={content} tokens={tokens} />;
  }

  return (
    <>
      <Ribbon name={preset.name} niche={preset.niche} />
      <LandingRenderer content={content} tokens={tokens} />
      {/* Public showcase = ephemeral mode. Visitors can play; nothing persists. */}
      <TweaksPanel
        initialTokens={tokens}
        initialTweaks={{}}
        mode="ephemeral"
        defaultOpen
      />
    </>
  );
}

function Ribbon({ name, niche }: { name: string; niche: string }) {
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
        fontFamily:
          '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "#3a3a40",
      }}
    >
      <Link href="/showcase" style={{ color: "inherit" }}>
        ← Showcase
      </Link>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ color: "#0a0a0a", fontWeight: 600 }}>
        {niche} · {name}
      </span>
    </div>
  );
}
