import Link from "next/link";
import { HERO, THEME_CATALOG } from "@/lib/marketing/copy";
import PresetMock from "./PresetMock";

/**
 * Hero — Option A.
 * Eyebrow → headline → sub → 2 CTAs → 3-up tilted preset stack → price strip.
 * No iframe, no stat dl. The visible artifacts answer "what am I buying"
 * in the first scroll.
 */
export default function Hero() {
  return (
    <section
      className="mk-hero relative overflow-hidden"
      aria-label="ShopLanding hero"
    >
      <div className="mk-container pb-16 pt-16 lg:pb-24 lg:pt-24">
        <div className="max-w-3xl">
          <p className="mk-eyebrow mk-eyebrow-on-dark inline-flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300"
              aria-hidden
            />
            Shopify · WooCommerce · 69-rule CRO system
          </p>
          <h1 className="mk-h1 mt-5 text-[var(--hero-ink)]">
            {HERO.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--hero-ink-2)]">
            Pre-built single-product landing themes for skincare, supplements,
            and gadgets — every block traceable to a documented conversion
            rule.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#themes" className="mk-btn mk-btn-primary">
              See the themes
              <span aria-hidden>→</span>
            </a>
            <Link href="/audit" className="mk-btn mk-btn-ghost-on-dark">
              Audit your store — free
            </Link>
            <Link
              href="/playbook"
              className="text-[14px] text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
            >
              {HERO.ctaSecondary}
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-zinc-500">
            $99 single · $249 unlimited · one-time, lifetime updates
          </p>
        </div>

        {/* 3-up tilted preset stack */}
        <div className="mk-stack mt-16 lg:mt-20">
          <div className="mk-stack-inner">
            {THEME_CATALOG.map((t) => (
              <PresetMock key={t.slug} theme={t} showLabel showChrome />
            ))}
          </div>
        </div>

        {/* Dark price strip */}
        <div className="mk-price-strip mt-24 lg:mt-28">
          <strong>
            $99 single store · $249 unlimited stores · +$199 done-for-you setup
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
