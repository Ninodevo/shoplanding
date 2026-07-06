import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";
import { getPrisma } from "@/lib/db";

export const revalidate = 3600;

export const metadata = {
  title: "How to increase your Shopify conversion rate: 7 levers",
  description:
    "A practical guide to raising Shopify conversion: page structure, above-the-fold trust, gallery depth, the buy box, social proof, AOV boosters, and scannable descriptions.",
  alternates: { canonical: "/guides/how-to-increase-shopify-conversion-rate" },
};

/**
 * "How to increase shopify conversion rate" — high-volume head-ish term.
 * Structure: honest benchmarks up top, then the 7 playbook blocks reframed
 * as levers, each with a distinct summary (not duplicated from the block
 * deep-dives) and a link into the corresponding /playbook/[block] page.
 */

const LEVER_SUMMARY: Record<string, string> = {
  general:
    "Every link that isn't the buy button is a place to lose the sale. Single-product pages convert best when the whole page is a corridor: no mega-nav, no footer link farm, a sticky buy bar for deep-scrollers, and a live-chat or phone escape valve for the almost-convinced.",
  "product-overview-above-the-cta-area":
    "The first screen either earns the scroll or loses the visitor. A descriptive title, a benefit-led subtitle, a star rating that jumps to reviews, and a three-item benefit checklist answer 'what is this and why should I care' in under five seconds.",
  "image-gallery":
    "Buyers can't touch the product, so the gallery has to do the handling for them. Four-plus photos covering context, scale, and detail — plus a short video — measurably reduce perceived risk. On mobile, swipe and pinch-zoom aren't nice-to-haves; they're expected physics.",
  "cta-area":
    "The buy box carries a third of all the rules for a reason: it's where money changes hands. Price beside the button, savings spelled out, shipping and returns within one eye-span, express payments for mobile — every unanswered question here is an open tab instead of an order.",
  "social-proof":
    "Trust is transferred, not claimed. Reviews with faces, names, occupations, and verified badges; an aggregate score near the title; a press strip if you have one. Depth beats volume — ten rich reviews outperform three hundred anonymous stars.",
  "conversion-and-aov-boosters":
    "Same conversion, bigger orders. Quantity breaks with a 'best value' badge, one or two genuinely complementary cross-sells, and honest urgency (a real shipping cutoff, not a fake timer) routinely add 15–25% to average order value.",
  "product-description":
    "Below the fold, structure beats prose. Benefit-led section titles, bullets, an FAQ pulled from your actual support inbox, a comparison table you author before someone else frames it, and a three-step 'how to use.'",
};

export default async function CvrGuide() {
  const prisma = getPrisma();
  const blocks = await prisma.block.findMany({ orderBy: { sortOrder: "asc" } });
  const total = blocks.reduce(
    (n, b) => n + (Array.isArray(b.mustInclude) ? (b.mustInclude as string[]).length : 0),
    0,
  );

  return (
    <>
      <Nav />
      <main>
        <article className="mk-section">
          <div className="mk-container max-w-3xl">
            <p className="mk-eyebrow">Guide</p>
            <h1 className="mk-h1 mt-4">
              How to increase your Shopify conversion rate.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--ink-2)]">
              Average Shopify stores convert somewhere between 1% and 2%; good
              single-product pages regularly run 3–5%. The difference is rarely
              the product — it&apos;s whether the page answers every buying
              question before the visitor has to go looking. This guide walks
              the {blocks.length} levers in the order a visitor experiences
              them, drawn from the {total}-rule playbook we build themes
              against.
            </p>
            <p className="mt-4 rounded-lg border border-[var(--line)] bg-[#fffdf8] px-4 py-3 text-[14px] text-[var(--ink-2)]">
              <strong className="text-[var(--ink)]">First: measure.</strong>{" "}
              Before changing anything, run your product page through the{" "}
              <Link href="/audit" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">
                free {total}-rule audit
              </Link>{" "}
              — it shows exactly which of the levers below your page is
              missing, ranked by impact. Fix the weight-3 failures first.
            </p>

            {blocks.map((b, i) => {
              const rules = Array.isArray(b.mustInclude)
                ? (b.mustInclude as string[])
                : [];
              return (
                <section key={b.slug} className="mt-12">
                  <h2 className="mk-h2">
                    Lever {i + 1}: {b.name}
                  </h2>
                  <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-2)]">
                    {LEVER_SUMMARY[b.slug] ?? b.purpose}
                  </p>
                  <p className="mt-3 text-[13.5px] text-[var(--muted)]">
                    {rules.length} checkable rules ·{" "}
                    <Link
                      href={`/playbook/${b.slug}`}
                      className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                    >
                      read the full breakdown →
                    </Link>
                  </p>
                </section>
              );
            })}

            <section className="mt-16 rounded-2xl border border-[var(--accent-soft)] bg-[#fffdf8] p-8">
              <h2 className="mk-h3">The order of operations</h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] text-[var(--ink-2)]">
                <li>
                  <Link href="/audit" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">
                    Audit your page
                  </Link>{" "}
                  — know which levers are broken before touching anything.
                </li>
                <li>Fix the weight-3 failures — they move the needle most.</li>
                <li>
                  Work block by block with the{" "}
                  <Link href="/guides/product-page-cro-checklist" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">
                    full {total}-rule checklist
                  </Link>
                  .
                </li>
                <li>
                  Or skip the retrofit: every{" "}
                  <Link href="/#themes" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">
                    ShopLanding theme
                  </Link>{" "}
                  ships all {total} rules implemented.
                </li>
              </ol>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
