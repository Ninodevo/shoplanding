import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Nav } from "@/components/marketing";
import { getPrisma } from "@/lib/db";

export const revalidate = 3600;

/**
 * Playbook block deep-dives — one indexable page per CRO block. These are
 * the SEO workhorses: each targets a long-tail query ("product page CTA
 * best practices", "social proof product page") with real content — the
 * block's rules from the DB plus hand-written editorial framing — and
 * funnels readers to the free audit.
 */

type BlockSeo = {
  /** SERP-targeted title. */
  title: string;
  metaDescription: string;
  /** On-page H1. */
  h1: string;
  /** Hand-written editorial intro — why this block moves conversion. */
  intro: string;
  /** Hand-written implementation guidance. */
  how: string;
};

const BLOCK_SEO: Record<string, BlockSeo> = {
  general: {
    title: "Landing page structure for one product: 4 foundational rules",
    metaDescription:
      "The 4 structural rules every single-product landing page needs: direct-to-checkout buying, sticky navigation, zero attention leaks, and a way to ask questions.",
    h1: "The foundation: 4 structural rules of a one-product page",
    intro:
      "Before any section gets designed, the page's skeleton decides how much attention survives to the buy button. A landing page is not a storefront — it exists to walk one visitor toward one decision. These four rules are about removing every exit and shortening every path.",
    how:
      "Audit your current page for exits first: count every clickable element that leads somewhere other than checkout. Nav menus, footer link farms, and logo links are the usual leaks. Then check the return path — when a visitor scrolls deep and decides to buy, how many swipes is the buy button away? A sticky bar answers that.",
  },
  "product-overview-above-the-cta-area": {
    title: "Product page above the fold: 6 rules for titles & overview",
    metaDescription:
      "What belongs above the CTA on a product page: descriptive titles under 65 characters, benefit-led subtitles, a rating linked to reviews, and a benefit checklist.",
    h1: "Above the fold: 6 rules for the product overview",
    intro:
      "Most visitors decide whether to keep reading in the first screen. The overview block's job is to answer three questions before a single scroll: what is this, why should I care, and do other people trust it. Every one of these six rules maps to one of those questions.",
    how:
      "Start with the title: descriptive beats clever, and under 65 characters means Google shows all of it. Put the star rating right next to the title and link it to the reviews section — that link is one of the highest-clicked elements on converting pages. Then compress your top benefits into a checkmark list a visitor can scan in three seconds.",
  },
  "image-gallery": {
    title: "Product page image gallery best practices: 9 rules",
    metaDescription:
      "9 gallery rules from a 69-rule CRO playbook: photo count, zoom, video, thumbnails, swipe support, and variant-aware imagery for product pages that convert.",
    h1: "The image gallery: 9 rules for product photography that sells",
    intro:
      "On a product page, the gallery is the closest a buyer gets to holding the product. Pages with one photo convert like pages with one review — thin proof reads as risk. These nine rules cover quantity, interaction, and the details most themes ignore, like variant-aware images and mobile swipe.",
    how:
      "The minimum viable gallery is four photos: hero shot, in-use shot, scale/context shot, and detail shot. Add one video if you have it — even a 15-second loop lifts engagement. Then test on a phone: can you swipe? Can you zoom with a pinch? Half of gallery failures are mobile-only.",
  },
  "cta-area": {
    title: "Product page CTA best practices: the 23 rules of the buy box",
    metaDescription:
      "23 buy-box rules covering CTA visibility, price prominence, shipping and returns near the button, express payments, BNPL, and variant selection — with examples.",
    h1: "The CTA area: 23 rules of a buy box that converts",
    intro:
      "A third of the entire playbook lives in one block, because the buy box is where conversion actually happens. Everything a buyer needs to say yes — price, trust, shipping, payment options — has to be within one eye-span of the button. Any question the buy box doesn't answer is a tab the visitor opens instead of buying.",
    how:
      "Work outward from the button: is it the most visible element on the page? Is the price beside it, with the saving spelled out when discounted? Then layer the reassurances — free-shipping line, stock status, returns promise — each one line, each within sight of the CTA. Finally, express payments: Shop Pay, Apple Pay, and PayPal buttons cut checkout steps for the majority of mobile buyers.",
  },
  "social-proof": {
    title: "Social proof on product pages: 8 rules that build trust",
    metaDescription:
      "8 social-proof rules: press logos, reviews with photos and verified badges, filterable star ratings, customer counts, and video testimonials for product pages.",
    h1: "Social proof: 8 rules for reviews people actually believe",
    intro:
      "Nobody believes a lonely five-star average anymore. Credible social proof is specific: a reviewer with a name, an age, an occupation, a photo of the product in their hands, and a verified-purchase badge. These eight rules turn 'reviews exist' into 'reviews persuade.'",
    how:
      "Upgrade review depth before review count. Ten reviews with photos, names, and occupations beat three hundred anonymous star-rows. Put the aggregate score near the title (see the overview block) and anchor-link it to this section. If the brand has any press mention, a logo strip above the reviews multiplies everything below it.",
  },
  "conversion-and-aov-boosters": {
    title: "AOV boosters: 9 upsell & urgency rules for product pages",
    metaDescription:
      "9 rules for raising average order value: quantity discounts, bundles, cross-sells, urgency and scarcity done honestly, and post-purchase upsells.",
    h1: "Conversion & AOV boosters: 9 rules that raise order value",
    intro:
      "Traffic is expensive; the cheapest revenue increase is a bigger cart from buyers you already convinced. Quantity breaks, bundles, and cross-sells routinely add 15–25% to average order value. The urgency rules work too — but only when they're true, and buyers have learned to smell the fake ones.",
    how:
      "Ship the quantity discount first: a 1× / 2× / 3× selector with a 'Best value' badge is the single highest-ROI addition to most product pages. Cross-sell one or two genuinely complementary items, not a carousel of your whole catalog. And if you use urgency, tie it to something real — an actual shipping cutoff beats a fake countdown every time.",
  },
  "product-description": {
    title: "Product description layout: 10 rules for pages people read",
    metaDescription:
      "10 description rules: scannable structure, benefit-led section titles, FAQ, comparison tables, specs, and how-to-use steps for product pages.",
    h1: "The description: 10 rules for content people actually read",
    intro:
      "Below the fold, nobody reads — they scan. The description block's rules are about structure, not prose: benefit-led section titles, bullets over paragraphs, an FAQ that kills support tickets, a comparison table that frames the alternatives, and a three-step 'how to use' that makes the product feel effortless.",
    how:
      "Rewrite your section headings first: each should state a benefit ('Lasts all day without reapplying'), not a feature ('Long-lasting formula'). Then add the FAQ — pull the five questions your support inbox actually receives. If buyers compare you to a known alternative, build the comparison table yourself — control the frame or someone else will.",
  },
};


export async function generateStaticParams() {
  return Object.keys(BLOCK_SEO).map((block) => ({ block }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ block: string }>;
}) {
  const { block } = await params;
  const seo = BLOCK_SEO[block];
  if (!seo) return { title: "Playbook — ShopLanding" };
  return {
    title: seo.title,
    description: seo.metaDescription,
    alternates: { canonical: `/playbook/${block}` },
  };
}

export default async function BlockPage({
  params,
}: {
  params: Promise<{ block: string }>;
}) {
  const { block: slug } = await params;
  const seo = BLOCK_SEO[slug];
  if (!seo) notFound();

  const prisma = getPrisma();
  const [blocks, rendered] = await Promise.all([
    prisma.block.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.renderedBlock.findMany({ orderBy: { position: "asc" } }),
  ]);
  const block = blocks.find((b) => b.slug === slug);
  if (!block) notFound();

  const idx = blocks.findIndex((b) => b.slug === slug);
  const prev = idx > 0 ? blocks[idx - 1] : null;
  const next = idx < blocks.length - 1 ? blocks[idx + 1] : null;

  const rules = Array.isArray(block.mustInclude)
    ? (block.mustInclude as string[])
    : [];
  const pitfalls = Array.isArray(block.pitfalls)
    ? (block.pitfalls as string[])
    : [];
  const components = rendered.filter((r) => {
    const s = Array.isArray(r.satisfies) ? (r.satisfies as string[]) : [];
    return s.includes(slug);
  });

  return (
    <>
      <Nav />
      <main>
        <article className="mk-section">
          <div className="mk-container max-w-3xl">
            <nav className="mk-eyebrow" aria-label="Breadcrumb">
              <Link href="/playbook" className="hover:underline underline-offset-4">
                Playbook
              </Link>
              <span className="mx-2 opacity-60">/</span>
              Block {idx + 1} of {blocks.length}
            </nav>
            <h1 className="mk-h1 mt-4">{seo.h1}</h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--ink-2)]">
              {seo.intro}
            </p>

            {/* Rules */}
            <section className="mt-14">
              <h2 className="mk-h2">
                The {rules.length} rules
              </h2>
              <ol className="mt-8 space-y-4">
                {rules.map((rule, i) => (
                  <li
                    key={i}
                    id={`rule-${i + 1}`}
                    className="flex gap-4 rounded-xl border border-[var(--line)] bg-[#fffdf8] p-5"
                  >
                    <span className="font-mono text-[13px] font-semibold text-[var(--accent-deep)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] leading-relaxed text-[var(--ink)]">
                      {rule}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            {/* How to implement */}
            <section className="mt-14">
              <h2 className="mk-h3">Where to start</h2>
              <p className="mt-4 leading-relaxed text-[var(--ink-2)]">{seo.how}</p>
            </section>

            {/* Pitfalls */}
            {pitfalls.length > 0 && (
              <section className="mt-14">
                <h2 className="mk-h3">Common pitfalls</h2>
                <ul className="mt-4 space-y-3">
                  {pitfalls.map((p, i) => (
                    <li key={i} className="flex gap-3 text-[15px] text-[var(--ink-2)]">
                      <span className="text-[#b9261b]" aria-hidden>
                        ✗
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Components */}
            {components.length > 0 && (
              <section className="mt-14">
                <h2 className="mk-h3">
                  How our themes satisfy this block
                </h2>
                <p className="mt-3 text-[15px] text-[var(--ink-2)]">
                  {components.length} of the 20 shipped components implement
                  these rules out of the box:
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {components.map((c) => (
                    <li key={c.slug} className="mk-chip">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* CTA */}
            <section className="mt-16 rounded-2xl border border-[var(--accent-soft)] bg-[#fffdf8] p-8">
              <h2 className="mk-h3">
                How does your page score on these {rules.length} rules?
              </h2>
              <p className="mt-3 text-[15px] text-[var(--ink-2)]">
                Paste your product URL — the free audit checks all 69 playbook
                rules (including everything on this page) and ranks your fixes
                by impact. No signup.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/audit" className="mk-btn mk-btn-primary">
                  Audit your page free →
                </Link>
                <Link href="/#themes" className="mk-btn mk-btn-ghost">
                  Or skip ahead: themes that score 69/69
                </Link>
              </div>
            </section>

            {/* Prev / next */}
            <nav className="mt-14 flex flex-wrap justify-between gap-3 border-t border-[var(--line)] pt-8 text-sm">
              {prev ? (
                <Link
                  href={`/playbook/${prev.slug}`}
                  className="text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  ← {prev.name}
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  href={`/playbook/${next.slug}`}
                  className="text-[var(--ink-2)] hover:text-[var(--ink)]"
                >
                  {next.name} →
                </Link>
              )}
            </nav>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
