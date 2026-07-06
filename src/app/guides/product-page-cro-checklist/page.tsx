import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";
import { getPrisma } from "@/lib/db";
import { BLOCK_ONE_LINER } from "@/lib/marketing/blockCopy";

export const revalidate = 3600;

export const metadata = {
  title: "Product page CRO checklist: 69 rules (free, no signup)",
  description:
    "The complete 69-point conversion checklist for product pages — structure, above-the-fold, gallery, buy box, social proof, AOV boosters, and description rules. Free.",
  alternates: { canonical: "/guides/product-page-cro-checklist" },
};

/**
 * "Product page CRO checklist" — the highest-intent SEO target we can own.
 * The full 69-rule playbook rendered as a scannable checklist, grouped by
 * block, with anchor nav and audit CTAs at natural break points. All rule
 * content comes from the DB (same source of truth as the audit + themes).
 */
export default async function ChecklistGuide() {
  const prisma = getPrisma();
  const blocks = await prisma.block.findMany({ orderBy: { sortOrder: "asc" } });
  const total = blocks.reduce(
    (n, b) => n + (Array.isArray(b.mustInclude) ? (b.mustInclude as string[]).length : 0),
    0,
  );

  // Precomputed global rule offsets per block (lint-clean: no render-time
  // mutation) — rule numbering runs 1..N across the whole checklist.
  const startIndexBySlug = new Map<string, number>();
  {
    let acc = 0;
    for (const b of blocks) {
      startIndexBySlug.set(b.slug, acc);
      acc += Array.isArray(b.mustInclude) ? (b.mustInclude as string[]).length : 0;
    }
  }

  return (
    <>
      <Nav />
      <main>
        <article className="mk-section">
          <div className="mk-container max-w-3xl">
            <p className="mk-eyebrow">Free checklist · no signup</p>
            <h1 className="mk-h1 mt-4">
              The product page CRO checklist: all {total} rules.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--ink-2)]">
              This is the complete checklist we build every ShopLanding theme
              against — distilled from published CRO research and a decade of
              DTC teardowns into {total} concrete, checkable rules across{" "}
              {blocks.length} blocks. Work through it top to bottom: the blocks
              are ordered the way a visitor experiences the page.
            </p>
            <p className="mt-4 text-[15px] text-[var(--muted)]">
              Shortcut: paste your URL into the{" "}
              <Link href="/audit" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">
                free audit
              </Link>{" "}
              and it checks all {total} rules against your live page in ~15
              seconds.
            </p>

            {/* Anchor nav */}
            <nav
              aria-label="Checklist sections"
              className="mt-10 flex flex-wrap gap-2 border-y border-[var(--line)] py-4"
            >
              {blocks.map((b, i) => (
                <a key={b.slug} href={`#${b.slug}`} className="mk-chip hover:border-[var(--accent)]">
                  {i + 1}. {b.name}
                </a>
              ))}
            </nav>

            {/* Blocks */}
            {blocks.map((b, bi) => {
              const rules = Array.isArray(b.mustInclude)
                ? (b.mustInclude as string[])
                : [];
              const startIndex = startIndexBySlug.get(b.slug) ?? 0;
              return (
                <section key={b.slug} id={b.slug} className="mt-14">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="mk-h2">
                      {bi + 1}. {b.name}
                    </h2>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      {rules.length} rules
                    </span>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
                    {BLOCK_ONE_LINER[b.slug] ?? ""}
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {rules.map((rule, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-lg border border-[var(--line-2)] bg-[#fffdf8] px-4 py-3 text-[14.5px] leading-relaxed"
                      >
                        <span
                          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--line)] font-mono text-[10px] text-[var(--muted)]"
                          aria-hidden
                        >
                          {startIndex + i + 1}
                        </span>
                        <span className="text-[var(--ink-2)]">{rule}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[13px] text-[var(--muted)]">
                    Deep dive with implementation notes:{" "}
                    <Link
                      href={`/playbook/${b.slug}`}
                      className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                    >
                      {b.name} — the full guide →
                    </Link>
                  </p>
                </section>
              );
            })}

            {/* Closing CTA */}
            <section className="mt-16 rounded-2xl border border-[var(--accent-soft)] bg-[#fffdf8] p-8">
              <h2 className="mk-h3">Two ways to use this checklist</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
                <strong className="text-[var(--ink)]">Audit your existing page</strong> —
                the free checker runs all {total} rules against any product URL
                and ranks the failures by conversion impact.{" "}
                <strong className="text-[var(--ink)]">Or start from {total}/{total}</strong> —
                every ShopLanding theme ships with every rule on this page
                already implemented.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/audit" className="mk-btn mk-btn-primary">
                  Run the free audit →
                </Link>
                <Link href="/#themes" className="mk-btn mk-btn-ghost">
                  See the themes
                </Link>
              </div>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
