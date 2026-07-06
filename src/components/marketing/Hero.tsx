import Link from "next/link";
import { HERO, THEME_CATALOG } from "@/lib/marketing/copy";
import PresetMock from "./PresetMock";

/**
 * Hero — "the conversion lab."
 * Deep-forest band with printed grain (see .mk-hero in globals.css).
 * Fraunces headline with an italic accent clause, mono spec-line, one
 * orchestrated load stagger (.mk-rise-*), then the 3-up tilted preset
 * stack and the spec-sheet price strip.
 */
export default function Hero() {
  return (
    <section
      className="mk-hero relative overflow-hidden"
      aria-label="ShopLanding hero"
    >
      <div className="mk-container pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="max-w-4xl">
          <p className="mk-eyebrow mk-eyebrow-on-dark mk-rise mk-rise-1 inline-flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300"
              aria-hidden
            />
            {HERO.eyebrow}
          </p>
          <h1 className="mk-h1 mk-rise mk-rise-2 mt-6 text-[var(--hero-ink)]">
            A high-converting product page,{" "}
            <em className="text-emerald-300">live this weekend.</em>
          </h1>
          <p className="mk-rise mk-rise-3 mt-7 max-w-2xl text-lg leading-relaxed text-[var(--hero-ink-2)]">
            {HERO.sub}
          </p>

          <div className="mk-rise mk-rise-4 mt-9 flex flex-wrap items-center gap-3">
            <Link href={HERO.ctaPrimaryHref} className="mk-btn mk-btn-primary">
              {HERO.ctaPrimary}
              <span aria-hidden>→</span>
            </Link>
            <a href={HERO.ctaSecondaryHref} className="mk-btn mk-btn-ghost-on-dark">
              {HERO.ctaSecondary}
            </a>
            <Link
              href="/playbook"
              className="text-[14px] text-[var(--hero-ink-2)] underline-offset-4 hover:text-[var(--hero-ink)] hover:underline"
            >
              Read the playbook
            </Link>
          </div>
          <p className="mk-rise mk-rise-5 mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--hero-ink-2)]">
            €99 single · €249 unlimited · one-time · lifetime updates
          </p>
        </div>

        {/* 3-up tilted preset stack */}
        <div className="mk-stack mk-rise mk-rise-5 mt-16 lg:mt-20">
          <div className="mk-stack-inner">
            {THEME_CATALOG.map((t) => (
              <PresetMock key={t.slug} theme={t} showLabel showChrome />
            ))}
          </div>
        </div>

        {/* Spec-sheet price strip */}
        <div className="mk-price-strip mt-24 lg:mt-28">
          <strong>
            €99 SINGLE · €249 UNLIMITED · +€199 SETUP
          </strong>
          <div className="mk-strip-tags">
            <span>One-time license</span>
            <span>Lifetime updates</span>
            <span>14-day refund</span>
          </div>
        </div>
      </div>
    </section>
  );
}
