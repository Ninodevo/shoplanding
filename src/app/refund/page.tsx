import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";

export const metadata = {
  title: "Refund policy",
  description:
    "14-day no-questions refund on digital licenses. How refunds work, how to request one, what's refundable, what's not.",
};

export default function RefundPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="mk-section">
          <div className="mk-container max-w-2xl">
            <p className="mk-eyebrow">Refund policy</p>
            <h1 className="mk-h1 mt-3">14 days, no questions.</h1>
            <p className="mt-5 text-lg text-[var(--ink-2)]">
              We&apos;d rather you spend €99 with confidence than have you
              hesitate at the buy button. Here&apos;s exactly how refunds
              work.
            </p>

            <div className="mt-12 space-y-8 text-[var(--ink-2)]">
              <section>
                <h2 className="mk-h3 text-[var(--ink)]">Digital licenses</h2>
                <p className="mt-3">
                  All digital theme licenses (Single-store and Unlimited-stores)
                  are refundable in full for <strong>14 days</strong> from the
                  date of purchase, no questions asked. You don&apos;t have to
                  justify the request, return anything, or fill out a form. Just
                  email us.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">Done-for-you setup</h2>
                <p className="mt-3">
                  The Done-for-you setup add-on (+€199) is refundable in full
                  until installation work begins. Once we&apos;ve started the
                  install — typically within 48 hours of your kickoff brief —
                  the add-on becomes non-refundable, though the underlying
                  theme license stays refundable under the 14-day terms.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">How to request</h2>
                <p className="mt-3">
                  Email{" "}
                  <Link
                    href="/contact"
                    className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                  >
                    hello@shoplanding.com
                  </Link>{" "}
                  from the address you bought with. Include your order ID or
                  license key. Refund processing happens via Lemon Squeezy
                  (our merchant of record) — they typically return the funds
                  to the original card within 5–10 business days.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">What we ask of you</h2>
                <p className="mt-3">
                  If you refund, your license is revoked — please uninstall the
                  theme from any stores it was deployed on. We don&apos;t
                  monitor or enforce this; we trust the buyer.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">After the 14 days</h2>
                <p className="mt-3">
                  Outside the 14-day window, refunds are at our discretion. If
                  something genuinely broke or the theme stopped working
                  through no fault of yours, write to us — we&apos;ll figure
                  it out. We&apos;re not in the business of pocketing money
                  from unhappy buyers.
                </p>
              </section>
            </div>

            <div className="mt-16 flex flex-wrap gap-3">
              <Link href="/contact" className="mk-btn mk-btn-primary">
                Email us
              </Link>
              <Link href="/" className="mk-btn mk-btn-ghost">
                ← Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
