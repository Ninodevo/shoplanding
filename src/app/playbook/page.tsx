import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { Footer, Nav } from "@/components/marketing";

export const metadata = {
  title: "Playbook — ShopLanding",
  description:
    "The block-by-block CRO system for single-product landing pages. Seven blocks, sixty-nine rules, twenty rendered components — open and inspectable.",
};

const PLACEMENT_LABEL: Record<string, string> = {
  "persistent-top": "Persistent · top",
  "persistent-bottom": "Persistent · bottom",
  "sticky-on-scroll": "Sticky on scroll",
  "in-flow": "In flow",
};

const PLACEMENT_TINT: Record<string, string> = {
  "persistent-top": "bg-emerald-100 text-emerald-900",
  "persistent-bottom": "bg-sky-100 text-sky-900",
  "sticky-on-scroll": "bg-amber-100 text-amber-900",
  "in-flow": "bg-[var(--surface-2)] text-[var(--ink-2)]",
};

/** Per-block accent shade for the eyebrow / number chip. */
const BLOCK_ACCENT: Record<string, string> = {
  general: "from-stone-100 to-stone-50",
  "product-overview-above-the-cta-area": "from-amber-100 to-amber-50",
  "image-gallery": "from-rose-100 to-rose-50",
  "cta-area": "from-emerald-100 to-emerald-50",
  "social-proof": "from-sky-100 to-sky-50",
  "conversion-and-aov-boosters": "from-violet-100 to-violet-50",
  "product-description": "from-teal-100 to-teal-50",
};

const BLOCK_GLYPH: Record<string, string> = {
  general: "◯",
  "product-overview-above-the-cta-area": "◐",
  "image-gallery": "▣",
  "cta-area": "★",
  "social-proof": "♥",
  "conversion-and-aov-boosters": "✦",
  "product-description": "✎",
};

export default async function PlaybookPage() {
  const prisma = getPrisma();
  const [blocks, rendered] = await Promise.all([
    prisma.block.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.renderedBlock.findMany({ orderBy: { position: "asc" } }),
  ]);

  // Reverse map: which rendered components satisfy each block.
  const byBlockSlug = new Map<string, typeof rendered>();
  for (const r of rendered) {
    const slugs = Array.isArray(r.satisfies) ? (r.satisfies as string[]) : [];
    for (const s of slugs) {
      const arr = byBlockSlug.get(s) ?? [];
      arr.push(r);
      byBlockSlug.set(s, arr);
    }
  }

  const ruleCount = blocks.reduce(
    (n, b) =>
      n + (Array.isArray(b.mustInclude) ? (b.mustInclude as string[]).length : 0),
    0,
  );

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="mk-section pb-12">
          <div className="mk-container">
            <p className="mk-eyebrow">The system, opened up</p>
            <h1 className="mk-h1 mt-4 max-w-4xl">
              How a ShopLanding page is built — block by block, rule by rule.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-[var(--ink-2)]">
              Two layers. The <strong className="text-[var(--ink)]">blocks</strong>{" "}
              are the rules: what every section must contain to convert. The{" "}
              <strong className="text-[var(--ink)]">components</strong> are how
              those rules show up on screen. Every theme we sell ships every
              component below, configured to satisfy every rule above.
            </p>

            <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-[var(--line)] pt-8">
              <Stat label="CRO blocks" value={blocks.length} />
              <Stat label="Conversion rules" value={ruleCount} />
              <Stat label="Rendered components" value={rendered.length} />
            </dl>
          </div>
        </section>

        {/* ANATOMY */}
        <section className="mk-section bg-[var(--surface)] py-20">
          <div className="mk-container">
            <header className="mb-12 max-w-2xl">
              <p className="mk-eyebrow">The page anatomy</p>
              <h2 className="mk-h2 mt-3">Top to bottom, in fixed order.</h2>
              <p className="mt-4 text-lg text-[var(--ink-2)]">
                Click any band to jump to its block details below. The order is
                opinionated; reordering breaks rule coverage.
              </p>
            </header>

            <Anatomy blocks={blocks} />
          </div>
        </section>

        {/* BLOCKS — the rules */}
        <section id="blocks" className="mk-section">
          <div className="mk-container">
            <header className="mb-12 max-w-2xl">
              <p className="mk-eyebrow">Layer 1 · the rules</p>
              <h2 className="mk-h2 mt-3">The 7 blocks.</h2>
              <p className="mt-4 text-lg text-[var(--ink-2)]">
                Each block groups conversion rules tuned for one job on the
                page. A rendered component satisfies one or more blocks.
              </p>
            </header>

            <ul className="space-y-6">
              {blocks.map((b, i) => {
                const rules = Array.isArray(b.mustInclude)
                  ? (b.mustInclude as string[])
                  : [];
                const renderedFor = byBlockSlug.get(b.slug) ?? [];
                return (
                  <li
                    key={b.id}
                    id={`block-${b.slug}`}
                    className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
                  >
                    {/* Header band */}
                    <header
                      className={`flex flex-wrap items-baseline justify-between gap-4 bg-gradient-to-br p-6 sm:p-8 ${
                        BLOCK_ACCENT[b.slug] ?? "from-stone-100 to-stone-50"
                      }`}
                    >
                      <div className="flex items-baseline gap-4">
                        <span
                          aria-hidden
                          className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)]"
                        >
                          {String(i + 1).padStart(2, "0")} / 07
                        </span>
                        <span aria-hidden className="text-2xl">
                          {BLOCK_GLYPH[b.slug] ?? "■"}
                        </span>
                        <h3 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
                          {b.name}
                        </h3>
                      </div>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold tracking-wide text-[var(--ink)]">
                        {rules.length} {rules.length === 1 ? "rule" : "rules"}
                      </span>
                    </header>

                    {/* Body */}
                    <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                      {/* Left: rules */}
                      <div>
                        <p className="mb-6 text-[15px] text-[var(--ink-2)]">
                          {b.purpose}
                        </p>
                        <ol className="space-y-3 text-[15px] text-[var(--ink-2)]">
                          {rules.map((rule, j) => (
                            <li
                              key={j}
                              className="flex gap-3 border-t border-[var(--line-2)] pt-3 first:border-t-0 first:pt-0"
                            >
                              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] font-mono text-[10px] font-semibold text-[var(--ink)]">
                                {j + 1}
                              </span>
                              <span className="leading-relaxed">{rule}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Right: components that satisfy this block */}
                      <aside className="md:border-l md:border-[var(--line)] md:pl-8">
                        <p className="mk-mono text-[var(--muted)]">
                          Components covering this block
                        </p>
                        {renderedFor.length === 0 ? (
                          <p className="mt-3 text-sm text-[var(--muted)]">
                            None
                          </p>
                        ) : (
                          <ul className="mt-4 grid gap-2">
                            {renderedFor.map((r) => (
                              <li key={r.id}>
                                <a
                                  href={`#component-${r.slug}`}
                                  className="flex items-center justify-between rounded-md border border-[var(--line)] bg-white px-3 py-2 text-[13px] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                                >
                                  <span className="font-medium text-[var(--ink)]">
                                    {r.name}
                                  </span>
                                  <span
                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                                      PLACEMENT_TINT[r.placement] ??
                                      "bg-[var(--surface-2)]"
                                    }`}
                                  >
                                    {PLACEMENT_LABEL[r.placement] ??
                                      r.placement}
                                  </span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </aside>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* COMPONENTS — the renderer */}
        <section
          id="components"
          className="mk-section bg-[var(--surface)] py-20"
        >
          <div className="mk-container">
            <header className="mb-12 max-w-2xl">
              <p className="mk-eyebrow">Layer 2 · the renderer</p>
              <h2 className="mk-h2 mt-3">
                The {rendered.length} components.
              </h2>
              <p className="mt-4 text-lg text-[var(--ink-2)]">
                Visual order matches the canonical landing template. Every
                component links back to one or more blocks above.
              </p>
            </header>

            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rendered.map((r) => {
                const satisfies = Array.isArray(r.satisfies)
                  ? (r.satisfies as string[])
                  : [];
                return (
                  <li
                    key={r.id}
                    id={`component-${r.slug}`}
                    className="rounded-xl border border-[var(--line)] bg-white p-5"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--ink-2)]">
                        {String(r.position + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-semibold tracking-tight text-[var(--ink)]">
                        {r.name}
                      </h3>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                      <span
                        className={`rounded px-2 py-0.5 font-semibold tracking-wide ${
                          PLACEMENT_TINT[r.placement] ??
                          "bg-[var(--surface-2)]"
                        }`}
                      >
                        {PLACEMENT_LABEL[r.placement] ?? r.placement}
                      </span>
                      <code className="font-mono text-[11px] text-[var(--muted)]">
                        {r.componentName}
                      </code>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-[var(--ink-2)]">
                      {r.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {satisfies.map((slug) => {
                        const b = blocks.find((x) => x.slug === slug);
                        return (
                          <a
                            key={slug}
                            href={`#block-${slug}`}
                            className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-2)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-deep)]"
                          >
                            {b?.name ?? slug}
                          </a>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mk-section">
          <div className="mk-container max-w-3xl text-center">
            <p className="mk-eyebrow">See it shipped</p>
            <h2 className="mk-h2 mt-3">
              You&apos;ve read the rules. Now walk one.
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-2)]">
              Each niche preset renders all 20 components above with brand-tuned
              tokens, content, and copy.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/showcase" className="mk-btn mk-btn-primary">
                Open the showcase →
              </Link>
              <Link href="/#themes" className="mk-btn mk-btn-ghost">
                Pick a theme to buy
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="font-mono text-3xl font-semibold tracking-tight text-[var(--ink)]">
        {value}
      </dd>
      <dt className="mt-1 text-[12px] uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </dt>
    </div>
  );
}

/**
 * Stacked-page anatomy diagram. Renders one band per block, ordered, with
 * height proportional to that block's rule count. Each band is an anchor link
 * down to the block detail. Pure CSS — light, scannable, no dependencies.
 */
function Anatomy({
  blocks,
}: {
  blocks: { slug: string; name: string; mustInclude: unknown }[];
}) {
  const totalRules = blocks.reduce(
    (n, b) => n + (Array.isArray(b.mustInclude) ? b.mustInclude.length : 0),
    0,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      {/* Mock browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 font-mono text-[11px] text-[var(--muted)]">
          shoplanding.com/themes/<span className="text-[var(--ink)]">…</span>
        </span>
      </div>

      <ol>
        {blocks.map((b, i) => {
          const ruleCount = Array.isArray(b.mustInclude)
            ? b.mustInclude.length
            : 0;
          // Min 56px, max ~140px height — scales with rule count.
          const minH = 56;
          const maxH = 140;
          const ratio = ruleCount / Math.max(totalRules / blocks.length, 1);
          const h = Math.round(minH + (maxH - minH) * Math.min(ratio, 2.2) / 2.2);
          return (
            <li key={b.slug} className="border-t border-[var(--line)] first:border-t-0">
              <a
                href={`#block-${b.slug}`}
                className={`flex items-center justify-between gap-4 bg-gradient-to-br px-6 transition-colors hover:brightness-95 ${
                  BLOCK_ACCENT[b.slug] ?? "from-stone-100 to-stone-50"
                }`}
                style={{ minHeight: h }}
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--ink-2)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span aria-hidden className="text-xl">
                    {BLOCK_GLYPH[b.slug] ?? "■"}
                  </span>
                  <span className="text-lg font-semibold tracking-tight text-[var(--ink)]">
                    {b.name}
                  </span>
                </div>
                <span className="font-mono text-[11px] tracking-wide text-[var(--ink-2)]">
                  {ruleCount} {ruleCount === 1 ? "rule" : "rules"} →
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
