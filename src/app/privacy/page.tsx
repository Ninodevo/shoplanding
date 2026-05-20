import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";

export const metadata = {
  title: "Privacy policy",
  description:
    "What ShopLanding stores about you, why, and how to get it deleted. Plain English, GDPR-aware, written by the founder not a lawyer.",
};

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="mk-section">
          <div className="mk-container max-w-2xl">
            <p className="mk-eyebrow">Privacy policy</p>
            <h1 className="mk-h1 mt-3">What we store, and why.</h1>
            <p className="mt-5 text-[var(--ink-2)]">
              Last updated: 2026-05-19. Plain English, GDPR-aware, no dark
              patterns.
            </p>

            <div className="mt-12 space-y-8 text-[var(--ink-2)]">
              <section>
                <h2 className="mk-h3 text-[var(--ink)]">What we collect</h2>
                <p className="mt-3">There are three places we collect data:</p>
                <ul className="mt-3 space-y-2 pl-0">
                  <li>
                    <strong className="text-[var(--ink)]">The audit tool</strong>{" "}
                    (<code className="font-mono">/audit</code>): the public URL
                    you submit, the audit result, a SHA-256 hash of your IP
                    address (for rate-limiting only — we can&apos;t reverse
                    it), and — if you unlock the report — your email.
                  </li>
                  <li>
                    <strong className="text-[var(--ink)]">Purchases:</strong>{" "}
                    Lemon Squeezy (our payment processor and merchant of
                    record) collects your name, billing address, and card
                    details. We see only your email, the order ID, and the
                    license key — never your card number.
                  </li>
                  <li>
                    <strong className="text-[var(--ink)]">Account sign-in</strong>{" "}
                    (if you create one): email + a Neon Auth session cookie.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">What we don&apos;t</h2>
                <ul className="mt-3 space-y-2 pl-0">
                  <li>No third-party analytics on the marketing site (no Google Analytics, no Hotjar, no Mixpanel).</li>
                  <li>No tracking cookies. Only session cookies for sign-in.</li>
                  <li>No selling, renting, or sharing email lists with anyone.</li>
                  <li>No retargeting pixels. No Facebook pixel.</li>
                </ul>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">Who we share with</h2>
                <ul className="mt-3 space-y-2 pl-0">
                  <li>
                    <strong className="text-[var(--ink)]">Lemon Squeezy</strong>{" "}
                    — payment processing. They are the seller of record;
                    their own privacy policy applies to your billing data.
                  </li>
                  <li>
                    <strong className="text-[var(--ink)]">Resend</strong> —
                    sends the audit unlock email + nurture sequence. They see
                    your email and the email body.
                  </li>
                  <li>
                    <strong className="text-[var(--ink)]">Anthropic</strong> —
                    powers the second-pass LLM scoring in the audit. We send
                    them a sanitized text snippet from the audited page, plus
                    the rule list. We don&apos;t send your email or any
                    personal data.
                  </li>
                  <li>
                    <strong className="text-[var(--ink)]">Neon</strong> —
                    hosts our Postgres database in the EU.
                  </li>
                </ul>
                <p className="mt-3">
                  No other third parties. That&apos;s the full list.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">Your rights (GDPR)</h2>
                <p className="mt-3">
                  Right to access, rectification, deletion, restriction,
                  portability, objection. To exercise any of them, email{" "}
                  <Link
                    href="/contact"
                    className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                  >
                    hello@shoplanding.com
                  </Link>
                  . For the audit tool specifically, replying
                  &quot;remove&quot; to any of our emails triggers an
                  immediate hard-delete of the row — no ticket, no wait.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">Retention</h2>
                <p className="mt-3">
                  Audit rows: kept until you ask for deletion, or 24 months
                  after the unlock — whichever is sooner. Orders: kept for 10
                  years (Croatian accounting law). Account sessions: rotated
                  every 30 days.
                </p>
              </section>

              <section>
                <h2 className="mk-h3 text-[var(--ink)]">Data controller</h2>
                <p className="mt-3">
                  ShopLanding d.o.o., Zagreb, Croatia. For privacy questions
                  in particular, reach Nino Mihovilić directly via the contact
                  page.
                </p>
              </section>
            </div>

            <div className="mt-16 flex flex-wrap gap-3">
              <Link href="/contact" className="mk-btn mk-btn-primary">
                Email us
              </Link>
              <Link href="/terms" className="mk-btn mk-btn-ghost">
                Terms of service
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
