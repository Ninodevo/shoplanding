import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Nav } from "@/components/marketing";
import ThemeLivePreview from "@/components/marketing/ThemeLivePreview";
import { getPrisma } from "@/lib/db";
import type { LandingContent } from "@/components/landing/types";

export const revalidate = 3600;

/**
 * Programmatic niche template pages — /templates/skincare etc. Each targets
 * "<niche> product page template" with a live embedded preview (the real
 * renderer, not a mockup), niche-specific editorial, and the theme CTA.
 * Fully DB-driven: a new preset row automatically gets a page + sitemap
 * entry.
 */

const NICHE_COPY: Record<
  string,
  { keyword: string; intro: string; points: string[] }
> = {
  skincare: {
    keyword: "Skincare product page template",
    intro:
      "Skincare buyers purchase on trust and texture — the page has to feel as considered as the formulation. This template leads with a calm, editorial layout, puts the ingredient story one scroll from the buy box, and gives reviews the specificity (skin type, age, routine) that makes them believable.",
    points: [
      "Ingredient transparency section with percentages — the trust currency of the category",
      "Subscribe & save built into the buy box for replenishable products",
      "Review cards carry age + skin-relevant detail, not anonymous stars",
      "Warm palette tokens you can retune to your brand in the customizer",
    ],
  },
  supplement: {
    keyword: "Supplement product page template",
    intro:
      "Supplement pages live or die on evidence. This template is built for claims that need receipts: quantified benefit bullets, a third-party-testing trust row, a label-style specs table, and a comparison block that frames you against the alternatives buyers already have open in another tab.",
    points: [
      "Benefit bullets built to carry numbers ('47 vitamins — third-party tested')",
      "Comparison table for the per-serve-cost math buyers do anyway",
      "Subscribe & save + bundle offers wired for the replenishment business model",
      "Specs table styled like a supplement label — category-native trust",
    ],
  },
  gadget: {
    keyword: "Gadget product page template",
    intro:
      "Electronics buyers arrive with a spec sheet open in another tab. This template front-loads the three numbers that win the comparison, keeps a scannable spec table one scroll away, and uses the gallery for the detail shots that make hardware feel premium.",
    points: [
      "Spec-forward subtitle: what it beats and what it costs versus the alternative",
      "Full specifications table with alternating rows — readable, not a wall",
      "Cross-sell tuned for accessories, not competing SKUs",
      "Steel-and-accent palette that reads 'hardware' out of the box",
    ],
  },
};

const PRESET_TO_THEME: Record<string, string> = {
  skincare: "skincare-orelle",
  supplement: "supplement-vitalstack",
  gadget: "gadget-aurabud",
};

export async function generateStaticParams() {
  const prisma = getPrisma();
  const presets = await prisma.layoutPreset.findMany({ select: { slug: true } });
  return presets.map((p) => ({ niche: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;
  const copy = NICHE_COPY[niche];
  const label = copy?.keyword ?? `${niche} product page template`;
  return {
    title: `${label} — live demo + 69-rule CRO structure`,
    description: `A complete ${niche} product page template for Shopify + WooCommerce: live demo, 69 conversion rules implemented, drop in your brand and launch. €99 one-time.`,
    alternates: { canonical: `/templates/${niche}` },
  };
}

export default async function NicheTemplatePage({
  params,
}: {
  params: Promise<{ niche: string }>;
}) {
  const { niche } = await params;
  const prisma = getPrisma();
  const preset = await prisma.layoutPreset.findUnique({ where: { slug: niche } });
  if (!preset) notFound();

  const seed = preset.demoSeed as unknown as LandingContent;
  const copy = NICHE_COPY[niche];
  const themeSlug = PRESET_TO_THEME[niche];

  return (
    <>
      <Nav />
      <main>
        <section className="mk-section pb-8">
          <div className="mk-container max-w-3xl">
            <p className="mk-eyebrow">Template · {preset.niche}</p>
            <h1 className="mk-h1 mt-4">
              {copy?.keyword ?? `${preset.niche} product page template`},
              built on 69 conversion rules.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--ink-2)]">
              {copy?.intro ??
                `A complete single-product page template for the ${preset.niche.toLowerCase()} niche — every section pre-built against the ShopLanding conversion playbook.`}
            </p>
            {copy && (
              <ul className="mt-8 space-y-3">
                {copy.points.map((pt, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
                    <span className="mk-check shrink-0">✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {themeSlug && (
                <Link href={`/themes/${themeSlug}`} className="mk-btn mk-btn-primary">
                  Get this template · €99 →
                </Link>
              )}
              <Link
                href={`/showcase/${preset.slug}`}
                className="mk-btn mk-btn-ghost"
                target="_blank"
              >
                Open the live customizer ↗
              </Link>
            </div>
          </div>
        </section>

        {/* Live preview — the real renderer in a frame */}
        <ThemeLivePreview
          presetSlug={preset.slug}
          hostname="example.shop"
          brandName={seed.brand.name}
        />

        <section className="mk-section bg-[var(--surface)]">
          <div className="mk-container max-w-3xl">
            <h2 className="mk-h2">What ships in the box</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-2)]">
              A Shopify theme zip (Online Store 2.0) and a WooCommerce
              landing-page plugin, both pre-loaded with this template&apos;s
              structure and demo content — swap in your brand, photos, and
              copy through the theme editor or one JSON file. Plus the
              portable system spec if your team builds on another stack.
              One license, lifetime updates, 14-day refund.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {themeSlug && (
                <Link href={`/themes/${themeSlug}`} className="mk-btn mk-btn-primary">
                  See pricing →
                </Link>
              )}
              <Link href="/audit" className="mk-btn mk-btn-ghost">
                First, audit your current page free
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
