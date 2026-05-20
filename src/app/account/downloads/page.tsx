import Link from "next/link";
import { getPrisma } from "@/lib/db";
import { requireSignedInUser } from "@/lib/auth/server";
import {
  ARTIFACT_KINDS,
  ARTIFACT_LABEL,
  type ArtifactKind,
} from "@/lib/packagers";
import { issueDownloadToken } from "@/lib/download-token";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your downloads — ShopLanding",
  description:
    "Re-download your themes, copy your license keys, and open personalized previews.",
  robots: { index: false, follow: false },
};

/**
 * `/account/downloads` — buyer's order history with fresh signed URLs.
 *
 * Auth strategy: the order's `userId` is set to the buyer's email by the
 * checkout webhook (Lemon Squeezy today; Stripe in Phase 4 before the swap).
 * When Neon Auth signs the buyer in with the same email, we match orders by
 * email until proper user-id columns land in a future migration.
 *
 * Fresh download tokens are minted per visit so the buyer never has to chase
 * an expired URL in their inbox — every page load gets a 7-day token.
 */
export default async function AccountDownloadsPage() {
  const user = await requireSignedInUser({
    callbackURL: "/account/downloads",
  });

  const prisma = getPrisma();
  const orders = await prisma.order.findMany({
    where: {
      // Pre-auth checkout orders set userId = email. Match by either column
      // so historical purchases surface for the right person.
      OR: [{ userId: user.id }, { userId: user.email }],
      status: "paid",
    },
    include: { theme: { include: { preset: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <article>
      <header className="mb-12 max-w-2xl">
        <p className="mk-eyebrow">Your account</p>
        <h1 className="mk-h1 mt-3">Downloads &amp; license keys.</h1>
        <p className="mt-5 text-lg text-[var(--ink-2)]">
          Signed in as <strong>{user.email}</strong>. Every theme you&apos;ve
          purchased shows up below with a fresh 7-day download URL each time
          you load this page.
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState email={user.email} />
      ) : (
        <ul className="grid gap-5">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function EmptyState({ email }: { email: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-8 text-center">
      <p className="mk-mono text-[var(--muted)]">No orders yet</p>
      <p className="mt-3 text-lg text-[var(--ink-2)]">
        Once you buy a theme, it shows up here for re-download.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Looking for an order placed under a different email? Sign in with that
        email instead — orders match the address used at checkout.
        Signed in: {email}.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/#themes" className="mk-btn mk-btn-primary">
          Browse themes →
        </Link>
        <Link href="/playbook" className="mk-btn mk-btn-ghost">
          Read the playbook
        </Link>
      </div>
    </div>
  );
}

function OrderCard({
  order,
}: {
  order: {
    id: string;
    tier: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: Date;
    licenseKey: string | null;
    previewSlug: string | null;
    theme: {
      name: string;
      version: string;
      preset: { slug: string; name: string; niche: string };
    };
  };
}) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {order.theme.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {order.theme.preset.niche} preset · v{order.theme.version} ·
            purchased {order.createdAt.toLocaleDateString()}
          </p>
        </div>
        <span className="mk-mono rounded bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent-deep)]">
          {tierLabel(order.tier)}
        </span>
      </header>

      <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Field label="License key">
          {order.licenseKey ? (
            <code className="font-mono">{order.licenseKey}</code>
          ) : (
            <span className="text-[var(--muted)]">—</span>
          )}
        </Field>
        <Field label="Personalized preview">
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
          ${(order.amountCents / 100).toFixed(2)} {order.currency}
        </Field>
        <Field label="Live demo">
          <Link
            href={`/showcase/${order.theme.preset.slug}`}
            className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
          >
            /showcase/{order.theme.preset.slug}
          </Link>
        </Field>
      </dl>

      {order.licenseKey && (
        <div className="mt-6 border-t border-[var(--line)] pt-5">
          <p className="mk-mono text-[var(--muted)]">Downloads</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {ARTIFACT_KINDS.map((kind: ArtifactKind) => {
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
          <p className="mt-2 text-[12px] text-[var(--muted)]">
            Each link is signed against your license key and expires in 7 days.
            Reload this page any time to mint fresh ones.
          </p>
        </div>
      )}
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
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function tierLabel(t: string): string {
  if (t === "single") return "Single-store · $99";
  if (t === "unlimited") return "Unlimited · $249";
  if (t === "setup") return "Setup add-on · +$199";
  return t;
}
