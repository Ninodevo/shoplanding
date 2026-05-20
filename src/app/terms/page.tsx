import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";

export const metadata = {
  title: "Terms of service",
  description:
    "Plain-English terms for the ShopLanding digital licenses and audit tool. Single-store and unlimited-stores license terms, restrictions, liability.",
};

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="mk-section">
          <div className="mk-container max-w-2xl">
            <p className="mk-eyebrow">Terms of service</p>
            <h1 className="mk-h1 mt-3">The agreement, plainly.</h1>
            <p className="mt-5 text-[var(--ink-2)]">
              Last updated: 2026-05-19. Effective on purchase.
            </p>

            <div className="mt-12 space-y-8 text-[var(--ink-2)]">
              <section>
                <h2 className="mk-h3 text-[var(--ink)]">1. Who we are</h2>
                <p className="mt-3">
                  &quot;ShopLanding&quot;, &quot;we&quot;, and &quot;us&quot;
                  refer to a Croatian d.o.o. (limited liability company)
                  operated by Nino Mihovilić in Zagreb, Croatia.
                  &quot;You&quot; means the buyer of a license or the user of
                  the free audit tool. Payments are processed by Lemon
                  Squeezy, who is the merchant of record on every sale.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">2. The license</h2>
                <p className="mt-3">
                  Every paid plan grants a non-exclusive, non-transferable
                  license to use the ShopLanding theme files and system spec
                  to build commercial product landing pages.
                </p>
                <ul className="mt-3 space-y-2 pl-0">
                  <li>
                    <strong className="text-[var(--ink)]">Single-store license</strong>{" "}
                    (€99): use on one Shopify or WooCommerce store, owned or
                    operated by the buyer.
                  </li>
                  <li>
                    <strong className="text-[var(--ink)]">Unlimited-stores license</strong>{" "}
                    (€249): use across unlimited stores you operate or build
                    for clients. Reselling client builds is permitted.
                  </li>
                </ul>
                <p className="mt-3">
                  What you can&apos;t do under any license: redistribute the
                  source theme files publicly, resell the theme as a
                  stand-alone product, or use it to build a competing
                  CRO-themes product. If in doubt, write to us.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">3. The audit tool</h2>
                <p className="mt-3">
                  The free PDP audit at <code className="font-mono">/audit</code>{" "}
                  is provided as-is for educational use. We store the URL you
                  submit, the audit result, and (if you unlock the report)
                  your email. We don&apos;t share or sell your email. You can
                  request hard deletion by replying &quot;remove&quot; to any
                  email we send.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">4. Refunds</h2>
                <p className="mt-3">
                  See the{" "}
                  <Link
                    href="/refund"
                    className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                  >
                    refund policy
                  </Link>
                  . Short version: 14 days, no questions, on the license. The
                  setup add-on is refundable until installation begins.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">5. Updates &amp; support</h2>
                <p className="mt-3">
                  Lifetime updates are included for the stores covered by your
                  license. &quot;Lifetime&quot; means for as long as the
                  ShopLanding product exists. Support is provided over email
                  on a best-effort basis — we don&apos;t guarantee response
                  times, but in practice we reply within 24–48 hours.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">6. Liability</h2>
                <p className="mt-3">
                  The theme and audit tool are provided as-is. We don&apos;t
                  guarantee specific conversion-rate outcomes — the system is
                  built on documented best practices, but conversion depends
                  on your product, audience, traffic source, and a hundred
                  other variables we don&apos;t control. Our maximum
                  liability under any claim is limited to what you paid for
                  the license.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">7. Governing law</h2>
                <p className="mt-3">
                  These terms are governed by the laws of Croatia. Disputes go
                  to the courts of Zagreb. EU consumer-protection rights are
                  unaffected.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">8. Changes</h2>
                <p className="mt-3">
                  We may update these terms; the &quot;Last updated&quot; date
                  at the top reflects the latest version. Material changes
                  apply to new purchases only — your existing license is
                  governed by the terms in force on the day you bought.
                </p>
              </section>
            </div>

            <div className="mt-16 flex flex-wrap gap-3">
              <Link href="/privacy" className="mk-btn mk-btn-ghost">
                Privacy policy
              </Link>
              <Link href="/contact" className="mk-btn mk-btn-ghost">
                Contact
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
