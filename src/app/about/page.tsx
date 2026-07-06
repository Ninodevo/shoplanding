import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";

export const metadata = {
  title: "About — why ShopLanding exists",
  description:
    "A solo, full-time obsession with single-product landing pages, built by Nino Mihovilić in Zagreb, Croatia. Why the system, how it ships, and who it's for.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main>
        <article className="mk-section">
          <div className="mk-container max-w-2xl">
            <p className="mk-eyebrow">About</p>
            <h1 className="mk-h1 mt-3">
              A system, not a marketplace.
            </h1>

            <div className="prose-shop mt-10 space-y-5 text-[17px] leading-relaxed text-[var(--ink-2)]">
              <p>
                I&apos;m <strong className="text-[var(--ink)]">Nino Mihovilić</strong>,
                based in Zagreb, Croatia. I spent the last few years building
                Shopify and WooCommerce stores for clients — mostly DTC,
                mostly single-product. Every project started the same way:
                buy a $30 theme, then spend two weeks bolting on the things
                the theme didn&apos;t ship with. Free-shipping strip. Reviews
                near the CTA. Bundle pricing. Sticky ATC. Express pay.
                Schema.org. The same 60-something patches every single time.
              </p>

              <p>
                ShopLanding is what happens when you stop patching and start
                from the conversion playbook instead. I sat down with the
                published CRO research — Baymard, Conversion.design&apos;s
                checklist, a decade of Shopify Plus case studies — and
                distilled the 69 highest-impact rules into 7 ordered blocks.
                Then I built the renderer + the Shopify theme that ship
                every one of those rules out of the box.
              </p>

              <p>
                That&apos;s the product: a landing page that&apos;s
                <em>defensibly</em> good before you change a single line.
                You drop in your brand, your photos, your copy. The
                conversion logic is already in place.
              </p>

              <h2 className="mk-h3 !text-[var(--ink)] !mt-12">
                What you&apos;re actually buying
              </h2>
              <ul className="space-y-2 pl-0">
                <li>A Shopify CLI 3 theme zip — drop it in via the dashboard or CLI.</li>
                <li>A portable system spec (JSON + Markdown) — your developer can rebuild the same anatomy in Hydrogen, Astro, Webflow, anywhere.</li>
                <li>A WooCommerce port is on the roadmap — free for every license holder the day it ships (lifetime updates).</li>
                <li>A live <Link href="/showcase" className="text-[var(--accent-deep)] underline-offset-4 hover:underline">customizer</Link> that takes your brand + content + photos and shows you the exact page you&apos;d ship.</li>
                <li>Lifetime updates for the stores covered by your license.</li>
              </ul>

              <h2 className="mk-h3 !text-[var(--ink)] !mt-12">
                Who it&apos;s for
              </h2>
              <ul className="space-y-2 pl-0">
                <li>Founders launching their first DTC product who don&apos;t want to spend the next month learning CRO.</li>
                <li>Agencies who&apos;ve quoted the same PDP-rebuild 50 times and want a defensible starting line.</li>
                <li>Operators with one product they care about more than the rest of the catalog.</li>
              </ul>

              <h2 className="mk-h3 !text-[var(--ink)] !mt-12">
                Who it&apos;s not for
              </h2>
              <ul className="space-y-2 pl-0">
                <li>Multi-category stores. The system is opinionated about <em>one product, one decision</em> — that&apos;s its strength and its limit.</li>
                <li>Teams that want a page builder. The block order is fixed; only content and visual tokens change.</li>
                <li>Anyone looking for the cheapest theme. There are $30 themes on the marketplace. Buy one if budget is the only consideration.</li>
              </ul>

              <h2 className="mk-h3 !text-[var(--ink)] !mt-12">
                How to reach me
              </h2>
              <p>
                Reply to any email that comes through — I read every one.
                Or:{" "}
                <Link
                  href="/contact"
                  className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                >
                  hello@shoplanding.com
                </Link>
                . If you&apos;re unsure whether the system fits your product,
                write before you buy. I&apos;ll be honest.
              </p>
            </div>

            <div className="mt-16 flex flex-wrap gap-3">
              <Link href="/audit" className="mk-btn mk-btn-primary">
                Audit your store — free →
              </Link>
              <Link href="/#themes" className="mk-btn mk-btn-ghost">
                See the themes
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
