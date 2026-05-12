import Section from "./Section";
import Reveal from "./Reveal";
import { PRICING_TIERS, priceLabel } from "@/lib/marketing/copy";

export default function Pricing() {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="One-time license. Lifetime updates."
      intro="No subscription. No discount theatre. Pay once, ship one product, keep the updates."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {PRICING_TIERS.map((tier, i) => (
          <Reveal key={tier.id} delay={i * 80}>
            <article
              className={`mk-card h-full ${
                tier.highlight
                  ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]"
                  : ""
              }`}
            >
              <header className="flex items-center justify-between">
                <span className="mk-mono text-[var(--muted)]">
                  {tier.eyebrow}
                </span>
                {tier.highlight && (
                  <span className="mk-chip mk-chip-accent">Best value</span>
                )}
              </header>
              <h3 className="mk-h3 mt-4">{tier.name}</h3>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-5xl font-semibold tracking-tight text-[var(--ink)]">
                  {priceLabel(tier.priceCents)}
                </span>
                <span className="text-[13px] text-[var(--muted)]">
                  {tier.cadence}
                </span>
              </p>
              <ul className="mt-6 space-y-3 text-[14px] text-[var(--ink-2)]">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mk-check shrink-0">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <a
                  href="#themes"
                  className={`mk-btn ${
                    tier.highlight ? "mk-btn-primary" : "mk-btn-ghost"
                  } w-full justify-center`}
                >
                  Pick a theme →
                </a>
                <p className="mt-2 text-center text-[12px] text-[var(--muted)]">
                  Buy buttons live on each theme page.
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
