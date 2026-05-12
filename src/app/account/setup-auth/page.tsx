import Link from "next/link";

export const metadata = {
  title: "Set up auth — ShopLanding",
  robots: { index: false, follow: false },
};

/**
 * Landing for the "auth not yet configured" state. Reached when an unauth
 * route is hit but `NEON_AUTH_BASE_URL` / `NEON_AUTH_COOKIE_SECRET` haven't
 * been set yet. Tells the operator (you) what's missing without breaking the
 * page for visitors.
 */
export default async function SetupAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ back?: string }>;
}) {
  const { back } = await searchParams;
  return (
    <article className="max-w-2xl">
      <p className="mk-eyebrow">Operator note</p>
      <h1 className="mk-h2 mt-3">Auth isn&apos;t configured yet.</h1>
      <p className="mt-5 text-lg text-[var(--ink-2)]">
        The marketing site, showcase, and theme pages all work without auth.
        Account features (downloads, license management, post-purchase preview
        ownership) need Neon Auth wired up.
      </p>

      <h2 className="mt-10 mk-h3">What to do</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-[var(--ink-2)]">
        <li>
          Provision a Neon Auth project in the Neon dashboard. Copy its{" "}
          <code className="font-mono text-[13px]">/auth</code> URL.
        </li>
        <li>
          Generate a 32+ char random string for cookie encryption:
          <pre className="mt-2 rounded-md bg-[var(--surface)] p-3 font-mono text-[12px] leading-relaxed">
            openssl rand -base64 32
          </pre>
        </li>
        <li>
          Add to <code className="font-mono">.env.local</code>:
          <pre className="mt-2 rounded-md bg-[var(--surface)] p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
            NEON_AUTH_BASE_URL=https://&lt;project&gt;.neonauth.&lt;region&gt;.aws.neon.tech/&lt;db&gt;/auth
            {"\n"}NEON_AUTH_COOKIE_SECRET=&lt;the-base64-string&gt;
          </pre>
        </li>
        <li>Restart <code className="font-mono">npm run dev</code>.</li>
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={back ?? "/"} className="mk-btn mk-btn-ghost">
          Back to {back === "/account/downloads" ? "downloads" : "home"}
        </Link>
        <a
          href="https://neon.tech/docs/neon-auth/quickstart"
          target="_blank"
          rel="noopener noreferrer"
          className="mk-btn mk-btn-primary"
        >
          Neon Auth docs ↗
        </a>
      </div>
    </article>
  );
}
