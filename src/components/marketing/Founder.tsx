import Link from "next/link";

/**
 * Founder strip — humanises the brand right before the pricing section.
 *
 * Up to this point in the page, the visitor has read "we" and "ShopLanding"
 * with no signal a human exists. At $99–€249 with no testimonials yet, that's
 * a credibility leak — the visitor needs to know there's a real person they
 * can hit reply to. The strip puts that person on the page in one card,
 * keeps the brand-as-system positioning intact, and offers a low-commitment
 * "reply to any email — that's me" hook in lieu of testimonials we don't
 * have yet.
 *
 * Replace the testimonials slot here once 3+ real customers ship.
 */
export default function Founder() {
  return (
    <section className="mk-section pt-8">
      <div className="mk-container">
        <article className="grid items-center gap-10 rounded-2xl border border-[var(--line)] bg-white p-8 sm:p-10 lg:grid-cols-[auto_1fr]">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-3xl font-semibold text-[var(--accent-deep)]"
            aria-hidden
          >
            NM
          </div>

          <div>
            <p className="mk-eyebrow">Who's behind this</p>
            <h2 className="mk-h3 mt-3">
              Built by Nino in Zagreb. Reply to any email — that&apos;s me.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--ink-2)]">
              ShopLanding is my full-time obsession. I read every audit that
              comes through, ship updates the same week buyers ask for them,
              and answer support emails personally — no inbox triage, no
              support ticket queue. If you&apos;re unsure whether the system
              fits your product, write to me before you buy. I&apos;ll be
              honest about it.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
              <Link
                href="/contact"
                className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
              >
                hello@shoplanding.com →
              </Link>
              <Link
                href="/about"
                className="text-[var(--ink-2)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
              >
                Why I built ShopLanding
              </Link>
              <span className="text-[13px] text-[var(--muted)]">
                Croatian d.o.o. · payments via Lemon Squeezy
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
