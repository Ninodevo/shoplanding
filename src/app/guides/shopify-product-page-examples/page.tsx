import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";
import { getPrisma } from "@/lib/db";
import type { LandingContent } from "@/components/landing/types";

export const revalidate = 3600;

export const metadata = {
  title: "Shopify product page examples: 3 annotated high-converting pages",
  description:
    "Three complete single-product page examples — skincare, supplement, and gadget — each annotated with the conversion decisions behind it. Live, clickable demos.",
  alternates: { canonical: "/guides/shopify-product-page-examples" },
};

/**
 * "Shopify product page examples" — searchers want to SEE pages, so this
 * guide is built around the three live showcase demos, each annotated with
 * what-to-steal editorial. The examples are clickable, full pages — not
 * screenshots — which is the differentiator versus every listicle ranking
 * for this term.
 */

const EXAMPLE_NOTES: Record<
  string,
  { steal: string[]; why: string }
> = {
  skincare: {
    why: "Warm, editorial, and calm — skincare buyers respond to pages that feel like the product: clean and considered. Watch how the page earns trust before it asks for money.",
    steal: [
      "The benefit checklist sits directly under the title — three scannable reasons to care before any scrolling.",
      "Reviews carry occupation and age ('Product designer, 31') — specificity is what makes social proof believable.",
      "The founder note is one paragraph with a face. It reads like a person, not an About page.",
    ],
  },
  supplement: {
    why: "Supplement buyers are skeptics by training — every claim on this page is either quantified ('47 vitamins, third-party tested') or attributed. The layout leads with evidence.",
    steal: [
      "Subscribe & save is offered inline, not as a popup — recurring revenue pitched as convenience.",
      "The comparison table names the categories buyers already compare on (per-serve cost, testing, dosage transparency).",
      "The specs table reads like a supplement label — meeting the category's trust conventions instead of fighting them.",
    ],
  },
  gadget: {
    why: "Gadget pages sell against a spec sheet the buyer already has open in another tab. This example front-loads the three numbers that matter and keeps the spec table one scroll away.",
    steal: [
      "The subtitle does the positioning in one line: what it beats, what it costs versus the alternative.",
      "Benefit bullets pair a number with a claim ('38-hour battery — beats every comp at this price').",
      "Cross-sell is accessories-only — things that make the main purchase better, not competing products.",
    ],
  },
};

export default async function ExamplesGuide() {
  const prisma = getPrisma();
  const presets = await prisma.layoutPreset.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <Nav />
      <main>
        <article className="mk-section">
          <div className="mk-container max-w-3xl">
            <p className="mk-eyebrow">Examples · live, not screenshots</p>
            <h1 className="mk-h1 mt-4">
              Shopify product page examples, annotated.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--ink-2)]">
              Three complete single-product pages — one per niche — each built
              against the same 69-rule conversion playbook and each live: you
              can scroll them, click the variants, open the FAQ. Under each
              one: the three decisions most worth stealing for your own page.
            </p>

            {presets.map((p, i) => {
              const seed = p.demoSeed as unknown as LandingContent;
              const notes = EXAMPLE_NOTES[p.slug];
              return (
                <section key={p.slug} className="mt-14">
                  <h2 className="mk-h2">
                    {i + 1}. {p.niche}: {seed.brand.name}
                  </h2>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    {seed.product.title}
                  </p>
                  {notes && (
                    <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-2)]">
                      {notes.why}
                    </p>
                  )}
                  {notes && (
                    <ul className="mt-5 space-y-3">
                      {notes.steal.map((s, j) => (
                        <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
                          <span className="mk-check shrink-0">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/showcase/${p.slug}`}
                      className="mk-btn mk-btn-primary"
                      target="_blank"
                    >
                      Open the live example ↗
                    </Link>
                    <Link href={`/templates/${p.slug}`} className="mk-btn mk-btn-ghost">
                      Use it as your template
                    </Link>
                  </div>
                </section>
              );
            })}

            <section className="mt-16 rounded-2xl border border-[var(--accent-soft)] bg-[#fffdf8] p-8">
              <h2 className="mk-h3">What all three share</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
                Different palettes, different copy, different niches — the same
                69 rules underneath. That&apos;s the point: conversion structure
                is repeatable even when brand isn&apos;t. Check how your current
                page compares with the{" "}
                <Link href="/audit" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">
                  free audit
                </Link>
                , or read the{" "}
                <Link href="/guides/product-page-cro-checklist" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">
                  full checklist
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
