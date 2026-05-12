import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { Footer, Nav, PresetMock } from "@/components/marketing";
import { THEME_CATALOG, type ThemeCatalogEntry } from "@/lib/marketing/copy";
import type { LandingContent, LandingTokens } from "@/components/landing/types";

export const revalidate = 600;

export const metadata = {
  title: "Showcase — ShopLanding",
  description:
    "Live demos of every niche preset, rendered from the same component tree we ship. Pick a preset and walk a real landing page.",
};

type PresetRow = {
  slug: string;
  name: string;
  niche: string;
  tokens: LandingTokens;
  demoSeed: LandingContent;
  /** The marketing thumbnail entry for this preset (palette + hover-swap mocks). */
  catalog?: ThemeCatalogEntry;
};

const CATALOG_BY_SLUG = new Map(
  THEME_CATALOG.map((c) => [c.slug, c] as const),
);

export default async function ShowcasePage() {
  const prisma = getPrisma();
  const rows = await prisma.layoutPreset.findMany({
    orderBy: { createdAt: "asc" },
  });

  const presets: PresetRow[] = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    niche: r.niche,
    tokens: r.tokens as unknown as LandingTokens,
    demoSeed: r.demoSeed as unknown as LandingContent,
    catalog: CATALOG_BY_SLUG.get(r.slug),
  }));

  return (
    <>
      <Nav />
      <main className="mk-section">
        <div className="mk-container">
          <header className="max-w-2xl">
            <p className="mk-eyebrow">Live demos · same renderer the buyer ships</p>
            <h1 className="mk-h1 mt-3">
              Three niche presets. One renderer. Walk a real landing page.
            </h1>
            <p className="mt-5 text-lg text-[var(--ink-2)]">
              Every preview below is rendered from the same component tree the
              buyer downloads — no iframes, no marketing screenshots. Click a
              preset to walk the full page; the tweaks panel opens automatically
              so you can recolor it on the fly.
            </p>
          </header>

          <ul className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presets.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/showcase/${p.slug}`}
                  className="mk-theme-card"
                  aria-label={`Open ${p.name} live demo`}
                >
                  {p.catalog ? (
                    <div className={`mk-theme-thumbs ${p.catalog.presetClass}`}>
                      <div className="mk-theme-thumb mk-theme-thumb-front">
                        <PresetMock theme={p.catalog} variant="front" showChrome />
                      </div>
                      <div className="mk-theme-thumb mk-theme-thumb-back">
                        <PresetMock theme={p.catalog} variant="back" showChrome />
                      </div>
                    </div>
                  ) : (
                    <Swatch tokens={p.tokens} />
                  )}
                  <div className="mk-theme-body">
                    <div className="mk-theme-row1">
                      <h3>{p.name}</h3>
                      <span className="mk-badge mk-badge-cov">69 / 69 rules</span>
                    </div>
                    <p className="mk-theme-pos">
                      {p.niche} · {p.demoSeed.product.title.split("—")[0]?.trim()}
                    </p>
                    <div className="mk-theme-foot">
                      <span className="mk-mono text-[var(--muted)]">
                        Try the panel ↓
                      </span>
                      <span className="text-[12px] font-semibold text-[var(--accent-deep)]">
                        Open live demo →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-12 max-w-xl text-sm text-[var(--muted)]">
            Want this rendered with your own brand?{" "}
            <Link
              href="/#themes"
              className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
            >
              Pick a theme to buy →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Swatch({ tokens }: { tokens: LandingTokens }) {
  return (
    <div className="flex gap-2 p-6" aria-hidden>
      {[tokens.accent, tokens.accentDeep, tokens.bg, tokens.surface, tokens.ink].map(
        (c, i) => (
          <span
            key={i}
            className="h-8 w-8 rounded-md border border-black/5"
            style={{ background: c }}
            title={c}
          />
        ),
      )}
    </div>
  );
}
