import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { Footer, Nav } from "@/components/marketing";
import {
  DELIVERABLE_ARTIFACT_KINDS,
  ARTIFACT_LABEL,
  type ArtifactKind,
} from "@/lib/packagers";
import { issueDownloadToken } from "@/lib/download-token";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order received — ShopLanding",
  description:
    "Your ShopLanding theme purchase is confirmed. License key and personalized preview URL inside.",
  robots: { index: false, follow: false },
};

/**
 * Lemon Squeezy redirects buyers here after a successful checkout. The
 * webhook at /api/lemonsqueezy/webhook is the source of truth for Order
 * creation, so we look up the row by `providerOrderId`. LS appends the
 * order id as `?order_id=…` to the redirect URL.
 *
 * There's a small window where this page can load before the webhook
 * lands — when that happens we render the "still processing" fallback
 * and the buyer refreshes.
 */
export default async function BuySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const sp = await searchParams;
  const orderId = sp.order_id;

  const prisma = getPrisma();
  const order = orderId
    ? await prisma.order.findUnique({
        where: { providerOrderId: orderId },
        include: { theme: { include: { preset: true } } },
      })
    : null;

  return (
    <>
      <Nav />
      <main className="mk-section">
        <div className="mk-container max-w-3xl">
          {!order ? (
            <Pending />
          ) : (
            <article>
              <p className="mk-eyebrow">Order received</p>
              <h1 className="mk-h1 mt-3">Thank you. Your theme is ready.</h1>
              <p className="mt-5 text-lg text-[var(--ink-2)]">
                We&apos;ve issued a license key and a personalized preview URL
                you can share now. Theme zip downloads land in{" "}
                <code className="font-mono">/account/downloads</code> as soon as
                your account is set up.
              </p>

              <dl className="mt-12 grid gap-6 rounded-lg border border-[var(--line)] bg-white p-6 sm:grid-cols-2">
                <Field label="Theme">
                  {order.theme.name}
                  <span className="ml-2 text-[var(--muted)]">
                    · v{order.theme.version}
                  </span>
                </Field>
                <Field label="Tier">{tierLabel(order.tier)}</Field>
                <Field label="License key">
                  <code className="font-mono text-[15px] tracking-wide">
                    {order.licenseKey}
                  </code>
                </Field>
                <Field label="Preview URL">
                  {order.previewSlug ? (
                    <Link
                      href={`/preview/${order.previewSlug}`}
                      className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                    >
                      /preview/{order.previewSlug}
                    </Link>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </Field>
                <Field label="Amount">
                  {formatAmount(order.amountCents, order.currency)}
                </Field>
                <Field label="Status">
                  <span className="rounded bg-[var(--accent-soft)] px-2 py-0.5 text-[var(--accent-deep)]">
                    {order.status}
                  </span>
                </Field>
              </dl>

              {order.licenseKey && (
                <section className="mt-12 rounded-lg border border-[var(--line)] bg-white p-6">
                  <p className="mk-eyebrow">Downloads</p>
                  <h2 className="mk-h3 mt-2">Your theme + the system spec.</h2>
                  <p className="mt-2 text-sm text-[var(--ink-2)]">
                    Each link is signed against your license key and expires in
                    7 days. Re-issue any time from your account dashboard. The
                    WooCommerce port lands here as a free update when it ships.
                  </p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {DELIVERABLE_ARTIFACT_KINDS.map((kind: ArtifactKind) => {
                      const token = issueDownloadToken({
                        orderId: order.id,
                        kind,
                        licenseKey: order.licenseKey!,
                      });
                      const href = `/api/download/${order.id}/${kind}?token=${token}`;
                      return (
                        <li key={kind}>
                          <a
                            href={href}
                            className="mk-btn mk-btn-ghost w-full justify-center"
                          >
                            {ARTIFACT_LABEL[kind]} ↓
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href={`/showcase/${order.theme.preset.slug}`}
                  className="mk-btn mk-btn-primary"
                  target="_blank"
                >
                  See live demo ↗
                </Link>
                <Link href="/" className="mk-btn mk-btn-ghost">
                  Back to home
                </Link>
              </div>

              <p className="mt-10 text-sm text-[var(--muted)]">
                A receipt has been emailed to {order.userId}. Save your license
                key — you&apos;ll need it to download zips and verify your
                installation later.
              </p>

              <div className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--ink-2)]">
                <strong className="text-[var(--ink)]">Tip — re-download anytime.</strong>{" "}
                <Link
                  href={`/auth/sign-up?callbackURL=${encodeURIComponent("/account/downloads")}`}
                  className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                >
                  Create an account with {order.userId}
                </Link>{" "}
                and your downloads will live at{" "}
                <code className="font-mono">/account/downloads</code> forever.
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Pending() {
  return (
    <article>
      <p className="mk-eyebrow">Order received</p>
      <h1 className="mk-h1 mt-3">Processing your order…</h1>
      <p className="mt-5 text-lg text-[var(--ink-2)]">
        Lemon Squeezy confirmed the charge. We&apos;re minting your license
        key now — usually a couple of seconds. Refresh the page.
      </p>
      <div className="mt-10">
        <Link href="/" className="mk-btn mk-btn-ghost">
          Back to home
        </Link>
      </div>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mk-mono text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-[15px]">{children}</dd>
    </div>
  );
}

function tierLabel(t: string): string {
  if (t === "single") return "Single-store license · €99";
  if (t === "unlimited") return "Unlimited-stores license · €249";
  if (t === "setup") return "Done-for-you setup · +€199";
  return t;
}

/**
 * Render an amount in its actual currency rather than assuming USD/EUR.
 * LS pays in EUR today but the column carries whatever LS sent, so this
 * stays right when we add USD or GBP stores later.
 */
function formatAmount(cents: number, currency: string): string {
  const c = (currency || "EUR").toUpperCase();
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: c,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${c}`;
  }
}
