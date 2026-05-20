import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";

export const metadata = {
  title: "Contact — get a human reply",
  description:
    "Email the founder directly. Pre-sales questions, niche fit, agency licensing, custom work — answered personally, usually same day.",
};

const SUPPORT_EMAIL = "hello@shoplanding.com";

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="mk-section">
          <div className="mk-container max-w-2xl">
            <p className="mk-eyebrow">Contact</p>
            <h1 className="mk-h1 mt-3">Get a human reply.</h1>
            <p className="mt-5 text-lg text-[var(--ink-2)]">
              One inbox, one human. I read every email and answer personally —
              usually same day, latest next morning Central European time.
            </p>

            <div className="mt-12 rounded-2xl border border-[var(--line)] bg-white p-8">
              <p className="mk-mono text-[var(--muted)]">Email</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p className="mt-3 text-sm text-[var(--ink-2)]">
                Or reply to any email we&apos;ve already sent you — the
                replies land in the same inbox.
              </p>
            </div>

            <h2 className="mk-h3 mt-16">Good things to write about</h2>
            <ul className="mt-5 space-y-3 text-[var(--ink-2)]">
              <li>
                <strong className="text-[var(--ink)]">Niche fit.</strong> Not
                sure if the system makes sense for your category? Send a link
                to your current PDP. I&apos;ll be honest if it does or
                doesn&apos;t.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Agency licensing.</strong>{" "}
                Need to brief a client, want bulk-license terms, building 10+
                stores a year? The Unlimited tier covers most of that;
                contact for anything heavier.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Custom blocks or niches.</strong>{" "}
                Working on a category we don&apos;t ship a preset for? Tell
                me. If there&apos;s a pattern, the next preset release covers
                it.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Bugs or theme issues.</strong>{" "}
                Include your license key and the store URL where the issue
                shows up.
              </li>
            </ul>

            <h2 className="mk-h3 mt-16">Not a good fit</h2>
            <p className="mt-4 text-[var(--ink-2)]">
              Generic theme support for stores running other people&apos;s
              themes, mass cold pitches, agencies offering &quot;rank #1 on
              Google&quot; — those don&apos;t get a reply. Everything else
              does.
            </p>

            <div className="mt-16 flex flex-wrap gap-3">
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
