import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { Footer, Nav } from "@/components/marketing";
import ThemeLivePreview from "@/components/marketing/ThemeLivePreview";
import RuleCoverage from "@/components/marketing/RuleCoverage";
import { isStripeConfigured } from "@/lib/stripe";
import { createCheckoutSession } from "@/app/buy/actions";
import type {
  LandingContent,
  LandingTokens,
} from "@/components/landing/types";

export const revalidate = 600;

export async function generateStaticParams() {
  const prisma = getPrisma();
  const rows = await prisma.theme.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prisma = getPrisma();
  const theme = await prisma.theme.findUnique({ where: { slug } });
  if (!theme) return { title: "Theme — ShopLanding" };
  return {
    title: `${theme.name} — ShopLanding theme`,
    description: theme.tagline,
  };
}

const TIERS = [
  {
    id: "single",
    eyebrow: "For founders",
    name: "Single-store license",
    cadence: "one-time · one Shopify or Woo store",
    bullets: [
      "Both Shopify + WooCommerce zips",
      "Portable system spec (JSON + Markdown)",
      "Tweaks panel + personalized preview URL",
      "Lifetime updates for that store",
    ],
    priceField: "priceSingleCents",
    cta: "Buy single-store",
  },
  {
    id: "unlimited",
    eyebrow: "For operators & agencies · Best value",
    name: "Unlimited-stores license",
    cadence: "one-time · every store you'll ever build",
    bullets: [
      "Everything in single-store",
      "Use across unlimited stores",
      "Resell client builds, no re-license",
      "Priority on niche-preset releases",
    ],
    priceField: "priceUnlimitedCents",
    cta: "Buy unlimited",
    highlight: true,
  },
  {
    id: "setup",
    eyebrow: "Add-on",
    name: "Done-for-you setup",
    cadence: "one-time · we install it for you",
    bullets: [
      "We install the theme on your store",
      "Wire payments + shipping + inventory",
      "Five sections of copy from your brief",
      "One round of revisions",
    ],
    priceField: "setupAddOnCents",
    cta: "Request setup",
  },
] as const;

export default async function ThemePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const canceled = sp.canceled === "1";

  const prisma = getPrisma();
  const theme = await prisma.theme.findUnique({
    where: { slug },
    include: { preset: true },
  });
  if (!theme || !theme.published) notFound();

  const stripeReady = isStripeConfigured();
  const tokens = theme.preset.tokens as unknown as LandingTokens;
  const seed = theme.preset.demoSeed as unknown as LandingContent;
  const formatUsd = (cents: number) =>
    `$${Math.round(cents / 100).toLocaleString("en-US")}`;

  return (
    <>
      <Nav />
      <main>
        <section className="mk-section">
          <div className="mk-container">
            {canceled && (
              <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Checkout canceled. No charge was made — try again any time.
              </div>
            )}

            <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
              <header>
                <p className="mk-eyebrow">{theme.preset.niche} theme · v{theme.version}</p>
                <h1 className="mk-h1 mt-3">{theme.name}</h1>
                <p className="mt-5 max-w-xl text-lg text-[var(--ink-2)]">
                  {theme.tagline}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#pricing" className="mk-btn mk-btn-primary">
                    See pricing →
                  </a>
                  <Link
                    href={`/showcase/${theme.preset.slug}`}
                    className="mk-btn mk-btn-ghost"
                    target="_blank"
                  >
                    Customize colors + copy ↗
                  </Link>
                </div>

                <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-[var(--ink-2)] sm:grid-cols-3">
                  <li>
                    <span className="mk-mono block text-[var(--muted)]">Niche</span>
                    {theme.preset.niche}
                  </li>
                  <li>
                    <span className="mk-mono block text-[var(--muted)]">Platforms</span>
                    Shopify · Woo
                  </li>
                  <li>
                    <span className="mk-mono block text-[var(--muted)]">CRO coverage</span>
                    69 / 69 rules
                  </li>
                  <li>
                    <span className="mk-mono block text-[var(--muted)]">Components</span>
                    20 rendered blocks
                  </li>
                  <li>
                    <span className="mk-mono block text-[var(--muted)]">Demo product</span>
                    {seed.product.title.split("—")[0]?.trim() ?? seed.product.title}
                  </li>
                  <li>
                    <span className="mk-mono block text-[var(--muted)]">Updates</span>
                    Lifetime
                  </li>
                </ul>
              </header>

              {/* Compact theme preview card — palette + brand identity */}
              <aside className="mk-card mk-card-accent">
                <p className="mk-mono text-[var(--muted)]">Preview · palette</p>
                <div className="mt-4 flex gap-2" aria-hidden>
                  {[tokens.accent, tokens.accentDeep, tokens.bg, tokens.surface, tokens.ink].map(
                    (c, i) => (
                      <span
                        key={i}
                        className="h-12 w-12 rounded-md border border-black/5"
                        style={{ background: c }}
                        title={c}
                      />
                    ),
                  )}
                </div>
                <div className="mt-6">
                  <span className="mk-mono text-[var(--muted)]">Demo brand</span>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {seed.brand.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-2)]">
                    {seed.brand.tagline}
                  </p>
                </div>
                <div className="mt-6 border-t border-[var(--line)] pt-5">
                  <span className="mk-mono text-[var(--muted)]">Starting at</span>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {formatUsd(theme.priceSingleCents)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    one-time · lifetime updates · 14-day refund
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Live preview — embedded showcase, no leaving the page */}
        <ThemeLivePreview
          presetSlug={theme.preset.slug}
          hostname="example.shop"
          brandName={seed.brand.name}
        />

        {/* Proof: every playbook rule, shipped */}
        <RuleCoverage />

        {/* Pricing tiers — buy buttons */}
        <section id="pricing" className="mk-section bg-[var(--surface)]">
          <div className="mk-container">
            <header className="mb-12 max-w-2xl">
              <p className="mk-eyebrow">Pricing · one-time</p>
              <h2 className="mk-h2 mt-3">Pay once. Ship today.</h2>
              <p className="mt-4 text-lg text-[var(--ink-2)]">
                Both Shopify and WooCommerce zips ship together. Lifetime updates. 14-day refund.
              </p>
            </header>

            <div className="grid gap-5 lg:grid-cols-3">
              {TIERS.map((tier) => {
                const cents = theme[tier.priceField];
                const highlight = "highlight" in tier && tier.highlight;
                return (
                  <article
                    key={tier.id}
                    className={`mk-card flex h-full flex-col ${
                      highlight
                        ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]"
                        : ""
                    }`}
                  >
                    <header className="flex items-center justify-between">
                      <span className="mk-mono text-[var(--muted)]">{tier.eyebrow}</span>
                      {highlight && <span className="mk-chip mk-chip-accent">Best value</span>}
                    </header>
                    <h3 className="mk-h3 mt-4">{tier.name}</h3>
                    <p className="mt-4 flex items-baseline gap-2">
                      <span className="font-mono text-5xl font-semibold tracking-tight">
                        {formatUsd(cents)}
                      </span>
                      <span className="text-[13px] text-[var(--muted)]">{tier.cadence}</span>
                    </p>
                    <ul className="mt-6 space-y-3 text-[14px] text-[var(--ink-2)]">
                      {tier.bullets.map((b) => (
                        <li key={b} className="flex gap-3">
                          <span className="mk-check shrink-0">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <form
                      action={createCheckoutSession}
                      className="mt-7"
                    >
                      <input type="hidden" name="themeSlug" value={theme.slug} />
                      <input type="hidden" name="tier" value={tier.id} />
                      <button
                        type="submit"
                        disabled={!stripeReady}
                        aria-disabled={!stripeReady}
                        className={`mk-btn ${
                          highlight ? "mk-btn-primary" : "mk-btn-ghost"
                        } w-full justify-center ${stripeReady ? "" : "opacity-60"}`}
                        title={
                          stripeReady
                            ? `Checkout: ${tier.name}`
                            : "Stripe not configured yet — drop test keys into .env.local."
                        }
                      >
                        {tier.cta}
                        <span aria-hidden>→</span>
                      </button>
                    </form>
                    <p className="mt-2 text-center text-[12px] text-[var(--muted)]">
                      {stripeReady
                        ? "Secure checkout via Stripe."
                        : "Buy buttons enable when Stripe keys land."}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
