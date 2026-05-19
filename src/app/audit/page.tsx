import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";
import { runAuditAndRedirect } from "./actions";

export const metadata = {
  title: "Audit your Shopify PDP · ShopLanding",
  description:
    "Paste a product URL — get a free 0–100 score against the 69-rule CRO playbook, with the top 5 fixes ranked by conversion impact.",
};

export default async function AuditLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error ? decodeURIComponent(sp.error) : null;

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <section className="mk-section pb-12">
          <div className="mk-container max-w-3xl">
            <p className="mk-eyebrow">Free · no sign-up</p>
            <h1 className="mk-h1 mt-4">
              Audit any product page. Get a 0–100 score in 15 seconds.
            </h1>
            <p className="mt-6 text-lg text-[var(--ink-2)]">
              Paste your Shopify (or any) product URL. We check it against
              the 69-rule conversion playbook and rank the top 5 fixes by
              impact. Built for solo founders and DTC operators.
            </p>

            <form
              action={runAuditAndRedirect}
              className="mt-10 flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="url"
                name="url"
                placeholder="https://yourstore.com/products/your-hero"
                required
                inputMode="url"
                autoComplete="url"
                className="flex-1 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-[15px] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
              <button
                type="submit"
                className="mk-btn mk-btn-primary justify-center"
              >
                Audit it →
              </button>
            </form>

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-[#f5d8d2] bg-[#fff0ed] px-4 py-3 text-sm text-[#b9261b]"
              >
                {errorMsg}
              </div>
            )}

            <p className="mt-3 text-[12px] text-[var(--muted)]">
              The score + per-block scoreboard show immediately. The ranked
              fixes + per-rule breakdown unlock with an email — one row, no
              spam, removable on request.
            </p>
          </div>
        </section>

        {/* WHAT WE CHECK */}
        <section className="mk-section bg-[var(--surface)]">
          <div className="mk-container">
            <header className="mb-12 max-w-2xl">
              <p className="mk-eyebrow">What we check</p>
              <h2 className="mk-h2 mt-3">Seven blocks. Sixty-nine rules. One score.</h2>
              <p className="mt-4 text-lg text-[var(--ink-2)]">
                Each rule is one row from the published ShopLanding playbook —
                what every high-converting single-product page has, why it
                matters, and how it&apos;s scored.
              </p>
            </header>

            <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {BLOCKS.map((b, i) => (
                <li
                  key={b.slug}
                  className="rounded-xl border border-[var(--line)] bg-white p-5"
                >
                  <span className="font-mono text-[11px] tracking-[0.16em] text-[var(--muted)]">
                    {String(i + 1).padStart(2, "0")} / 07
                  </span>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">
                    {b.name}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
                    {b.what}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-12 text-sm text-[var(--muted)]">
              Want the full per-rule playbook?{" "}
              <Link
                href="/playbook"
                className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
              >
                Read it on /playbook →
              </Link>
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mk-section">
          <div className="mk-container">
            <header className="mb-12 max-w-2xl">
              <p className="mk-eyebrow">How it works</p>
              <h2 className="mk-h2 mt-3">Honest about what we can — and can&apos;t — detect.</h2>
              <p className="mt-4 text-lg text-[var(--ink-2)]">
                We run heuristics on the page&apos;s HTML, Schema.org product
                data, and visible content. The qualitative rules a heuristic
                can&apos;t judge go through a second AI pass against the page
                text — anything still ambiguous stays flagged manual, so the
                score never inflates.
              </p>
            </header>

            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={i}>
                  <span className="font-mono text-[11px] tracking-[0.16em] text-[var(--accent-deep)]">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[14px] text-[var(--ink-2)]">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const BLOCKS = [
  { slug: "general", name: "General",
    what: "Sticky nav, no outgoing link traps, live chat or phone — does the page keep attention on the buy decision?" },
  { slug: "product-overview", name: "Product overview",
    what: "Title length, subtitle power words, rating + review jump-link, key-benefit checklist visible above the CTA." },
  { slug: "image-gallery", name: "Image gallery",
    what: "Number of photos, gallery videos, thumbnails, swipe + zoom signals, variant-aware imagery." },
  { slug: "cta-area", name: "CTA area (23 rules)",
    what: "CTA prominence, price visible + discounted, free shipping, in-stock, returns, express + BNPL payments." },
  { slug: "social-proof", name: "Social proof",
    what: "Press logos, reviews near CTA, star rating + count, live activity, customer photos with the product." },
  { slug: "aov-boosters", name: "Conversion + AOV boosters",
    what: "Bundle / qty discounts, subscribe-and-save, urgency, scarcity, cross-sell." },
  { slug: "description", name: "Product description",
    what: "FAQ, comparison vs alternatives, specs table, 3-step how-to, benefits-led section titles." },
];

const STEPS = [
  {
    title: "Paste a public URL",
    body: "We fetch it server-side. Anything not publicly accessible (login wall, geo block) won't audit.",
  },
  {
    title: "Heuristics + AI pass",
    body: "30 deterministic DOM + Schema.org checks, then a single AI pass against the page text for the qualitative rules. Ambiguous calls stay manual.",
  },
  {
    title: "Get scored + prioritized",
    body: "Block-by-block 0–100 with the top 5 fixes ranked by impact weight. Sharable URL.",
  },
];
