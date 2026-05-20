import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Nav } from "@/components/marketing";
import { getPrisma } from "@/lib/db";
import type { AuditResult } from "@/lib/audit/score";
import { recommendThemeFor } from "@/lib/audit/niche";
import { unlockAuditWithEmail } from "./actions";

export const dynamic = "force-dynamic";

const BLOCK_LABEL: Record<string, string> = {
  general: "General",
  "product-overview-above-the-cta-area": "Product overview",
  "image-gallery": "Image gallery",
  "cta-area": "CTA area",
  "social-proof": "Social proof",
  "conversion-and-aov-boosters": "AOV boosters",
  "product-description": "Product description",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prisma = getPrisma();
  const audit = await prisma.audit.findUnique({
    where: { id },
    select: { url: true, score: true },
  });
  if (!audit) return { title: "Audit not found · ShopLanding" };
  return {
    title: `Audit ${audit.score}/100 · ${new URL(audit.url).hostname}`,
    description: `Scored against the 69-rule ShopLanding playbook.`,
    robots: { index: false, follow: false },
  };
}

export default async function AuditResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const errorMsg = sp.error ? decodeURIComponent(sp.error) : null;

  const prisma = getPrisma();
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) notFound();

  const r = audit.rawResult as unknown as AuditResult;
  const hostname = safeHost(audit.url);
  const fetched = new Date(r.fetchedAt);
  const unlocked = Boolean(audit.email);
  const recommendation = recommendThemeFor({ url: audit.url, result: r });

  // Top-level counts for the public summary card
  const totals = r.blocks.reduce(
    (acc, b) => {
      acc.pass += b.pass;
      acc.fail += b.fail;
      acc.unknown += b.unknown;
      return acc;
    },
    { pass: 0, fail: 0, unknown: 0 },
  );

  return (
    <>
      <Nav />
      <main>
        {/* HERO — score (always public) */}
        <section className="mk-section pb-10">
          <div className="mk-container">
            <p className="mk-eyebrow">Audit result</p>
            <div className="mt-6 grid items-start gap-10 lg:grid-cols-[auto_1fr]">
              <ScoreDial value={r.overallScore} />
              <div>
                <h1 className="mk-h2 break-words">
                  {hostname}
                </h1>
                <p className="mt-2 text-sm text-[var(--muted)] break-all">
                  <a
                    href={r.finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline underline-offset-4"
                  >
                    {r.finalUrl} ↗
                  </a>
                </p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Audited {fetched.toLocaleString()}
                </p>

                {r.page.schemaName && (
                  <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                    <Field label="Detected product">
                      <span className="text-[var(--ink)]">{r.page.schemaName}</span>
                    </Field>
                    {r.page.schemaBrand && (
                      <Field label="Brand">
                        <span className="text-[var(--ink)]">{r.page.schemaBrand}</span>
                      </Field>
                    )}
                    {r.page.starRating !== null && (
                      <Field label="Rating">
                        {r.page.starRating} / 5
                        {r.page.reviewCount !== null && (
                          <span className="ml-1 text-[var(--muted)]">· {r.page.reviewCount} reviews</span>
                        )}
                      </Field>
                    )}
                    {r.page.priceText && (
                      <Field label="Price">{r.page.priceText}</Field>
                    )}
                  </dl>
                )}

                {/* Headline counts — public proof that there's substance behind the gate */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Stat label="passing" value={totals.pass} tone="pass" />
                  <Stat label="failing" value={totals.fail} tone="fail" />
                  <Stat label="manual" value={totals.unknown} tone="manual" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK SUMMARY (always public — counts only, no per-rule list) */}
        <section className="mk-section bg-[var(--surface)] py-14">
          <div className="mk-container">
            <header className="mb-8 max-w-2xl">
              <p className="mk-eyebrow">Block scoreboard</p>
              <h2 className="mk-h2 mt-3">The seven blocks at a glance.</h2>
              <p className="mt-3 text-[var(--ink-2)]">
                One row per playbook block, with the per-rule scoreboard. The
                ranked top fixes and per-rule call-outs are below the line.
              </p>
            </header>

            <ul className="grid gap-3">
              {r.blocks.map((b) => (
                <li
                  key={b.blockSlug}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-white px-5 py-4"
                >
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {BLOCK_LABEL[b.blockSlug] ?? b.blockSlug}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] tracking-wide text-[var(--muted)]">
                      {b.pass} pass · {b.fail} fail · {b.unknown} manual
                    </p>
                  </div>
                  <BlockScorePill score={b.score} hasCounted={b.pass + b.fail > 0} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── GATE ─────────────────────────────────────────────────────────── */}
        {!unlocked ? (
          <section id="unlock" className="mk-section">
            <div className="mk-container max-w-2xl">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-8 shadow-sm">
                <p className="mk-eyebrow">Unlock the full report</p>
                <h2 className="mk-h2 mt-3">
                  {r.topFixes.length > 0
                    ? `${r.topFixes.length} ranked fixes + the per-rule breakdown.`
                    : `The per-rule breakdown — what passed, what failed, what needs eyes.`}
                </h2>
                <p className="mt-4 text-[var(--ink-2)]">
                  Drop your email. We&apos;ll unlock the per-rule breakdown,
                  rank the highest-leverage fixes, and email you the shareable
                  link so you can come back to it. No spam — one short note
                  per major playbook release.
                </p>

                {errorMsg && (
                  <div
                    role="alert"
                    className="mt-5 rounded-md border border-[#f5d8d2] bg-[#fff0ed] px-4 py-3 text-sm text-[#b9261b]"
                  >
                    {errorMsg}
                  </div>
                )}

                <form
                  action={unlockAuditWithEmail}
                  className="mt-6 flex flex-col gap-2 sm:flex-row"
                >
                  <input type="hidden" name="auditId" value={id} />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@yourstore.com"
                    required
                    inputMode="email"
                    autoComplete="email"
                    className="flex-1 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-[15px] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                  <button
                    type="submit"
                    className="mk-btn mk-btn-primary justify-center"
                  >
                    Unlock report →
                  </button>
                </form>

                <p className="mt-4 text-[12px] text-[var(--muted)]">
                  We store one row: email + the audit you just ran. You can
                  reply &quot;remove&quot; to any future email and we&apos;ll
                  hard-delete the row.
                </p>
              </div>

              {/* Peek of what's behind the gate */}
              <div className="mt-10">
                <p className="mk-eyebrow text-[var(--muted)]">Locked preview</p>
                <ul className="mt-3 space-y-2">
                  {r.topFixes.slice(0, Math.min(3, r.topFixes.length)).map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--line)] bg-white/70 px-4 py-3"
                    >
                      <span className="font-mono text-xs text-[var(--muted)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 truncate text-sm text-[var(--ink-2)] [filter:blur(6px)] select-none">
                        {f.text}
                      </span>
                      <WeightChip weight={f.weight} />
                    </li>
                  ))}
                  {r.topFixes.length === 0 && (
                    <li className="rounded-lg border border-dashed border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--muted)]">
                      No machine-detectable failures — the LLM-scored manual
                      rules still need an unlock.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* TOP FIXES (unlocked) */}
            {r.topFixes.length > 0 && (
              <section id="top-fixes" className="mk-section py-16">
                <div className="mk-container">
                  <header className="mb-8 max-w-2xl">
                    <p className="mk-eyebrow">Top fixes · ranked by impact</p>
                    <h2 className="mk-h2 mt-3">Fix these first.</h2>
                    <p className="mt-3 text-[var(--ink-2)]">
                      Each one is a rule the page is missing. Weight 3 = biggest lever, 1 = polish.
                    </p>
                  </header>

                  <ol className="grid gap-3">
                    {r.topFixes.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-4 rounded-xl border border-[var(--line)] bg-white px-5 py-4"
                      >
                        <span className="font-mono text-2xl font-semibold text-[#b9261b] tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                              {BLOCK_LABEL[f.blockSlug] ?? f.blockSlug}
                            </span>
                            <WeightChip weight={f.weight} />
                          </div>
                          <p className="mt-1 text-[15px] text-[var(--ink)]">{f.text}</p>
                          {f.note && (
                            <p className="mt-1 text-[13px] text-[var(--muted)]">{f.note}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

            {/* BLOCK BREAKDOWN (unlocked) */}
            <section className="mk-section bg-[var(--surface)]">
              <div className="mk-container">
                <header className="mb-8 max-w-2xl">
                  <p className="mk-eyebrow">Block by block</p>
                  <h2 className="mk-h2 mt-3">The full per-rule breakdown.</h2>
                  <p className="mt-3 text-[var(--ink-2)]">
                    Rules a heuristic can&apos;t judge are scored by AI and
                    tagged{" "}
                    <span className="font-mono text-[10px] uppercase tracking-wider rounded bg-[var(--surface-2)] px-1.5 py-0.5">ai</span>.
                    Anything still ambiguous stays{" "}
                    <span className="font-mono text-[11px] uppercase tracking-wider rounded bg-[var(--surface-2)] px-1.5 py-0.5">manual</span>{" "}
                    so the score doesn&apos;t inflate.
                  </p>
                </header>

                <div className="grid gap-4">
                  {r.blocks.map((b) => {
                    const rulesForBlock = r.rules.filter((x) => x.blockSlug === b.blockSlug);
                    return (
                      <article
                        key={b.blockSlug}
                        className="overflow-hidden rounded-xl border border-[var(--line)] bg-white"
                      >
                        <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
                          <div className="flex items-baseline gap-3">
                            <h3 className="text-lg font-semibold tracking-tight">
                              {BLOCK_LABEL[b.blockSlug] ?? b.blockSlug}
                            </h3>
                            <span className="font-mono text-[11px] tracking-wide text-[var(--muted)]">
                              {b.pass} pass · {b.fail} fail · {b.unknown} manual
                            </span>
                          </div>
                          <BlockScorePill score={b.score} hasCounted={b.pass + b.fail > 0} />
                        </header>

                        <ul className="divide-y divide-[var(--line-2)]">
                          {rulesForBlock.map((rule, i) => (
                            <li key={i} className="flex items-start gap-3 px-5 py-3 text-[14px]">
                              <StatusIcon status={rule.status} />
                              <div className="flex-1">
                                <p className={rule.status === "fail" ? "text-[var(--ink-2)]" : "text-[var(--ink)]"}>
                                  {rule.text}
                                </p>
                                {rule.note && (
                                  <p className="mt-0.5 text-[12px] text-[var(--muted)]">{rule.note}</p>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <WeightChip weight={rule.weight} />
                                {rule.aiAssisted && <AiChip />}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {/* CTA — niche-aware when we can match, generic otherwise */}
        {recommendation && unlocked ? (
          <section className="mk-section bg-[var(--surface)]">
            <div className="mk-container max-w-3xl">
              <div className="rounded-2xl border border-[var(--accent-soft)] bg-white p-8 shadow-sm">
                <p className="mk-eyebrow text-[var(--accent-deep)]">
                  Recommended for {hostname}
                </p>
                <h2 className="mk-h2 mt-3">
                  {recommendation.label} — scores 69/69 out of the box.
                </h2>
                <p className="mt-4 text-[var(--ink-2)]">
                  {recommendation.reason} Same audit, but the page is the
                  one you&apos;re running — and every block ships in the zip.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={recommendation.href}
                    className="mk-btn mk-btn-primary"
                  >
                    Get the {recommendation.label.split(" · ")[1] ?? recommendation.label} theme · €99 →
                  </Link>
                  <Link
                    href={`/showcase/${recommendation.niche}`}
                    className="mk-btn mk-btn-ghost"
                  >
                    See it live
                  </Link>
                </div>
                <p className="mt-6 text-xs text-[var(--muted)]">
                  Don&apos;t see your niche? <Link href="/#themes" className="underline-offset-4 hover:underline">Browse all themes</Link> · share this audit:{" "}
                  <code className="font-mono">/audit/{id}</code>
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="mk-section bg-[var(--surface)]">
            <div className="mk-container max-w-3xl text-center">
              <p className="mk-eyebrow">The system that satisfies all 69</p>
              <h2 className="mk-h2 mt-3">
                Want a theme that ships these by default?
              </h2>
              <p className="mt-4 text-[var(--ink-2)]">
                Every ShopLanding niche preset is built to score 69 / 69 out of
                the box. Same audit, but the page is the one you&apos;re running.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/#themes" className="mk-btn mk-btn-primary">
                  See the themes →
                </Link>
                <Link href="/playbook" className="mk-btn mk-btn-ghost">
                  Read the full playbook
                </Link>
              </div>
              <p className="mt-6 text-sm text-[var(--muted)]">
                Want to share this audit? Send <code className="font-mono">/audit/{id}</code>.
              </p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

// ── small subcomponents ─────────────────────────────────────────────────

function ScoreDial({ value }: { value: number }) {
  const stroke = 12;
  const size = 160;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, value)) / 100);
  const color =
    value >= 80
      ? "var(--accent)"
      : value >= 50
      ? "#d49a3a"
      : "#b9261b";
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-semibold tabular-nums">{value}</span>
        <span className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          / 100
        </span>
      </div>
    </div>
  );
}

function BlockScorePill({ score, hasCounted }: { score: number; hasCounted: boolean }) {
  if (!hasCounted) {
    return (
      <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">
        — / 100 · all manual
      </span>
    );
  }
  const cls =
    score >= 80
      ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
      : score >= 50
      ? "bg-amber-100 text-amber-900"
      : "bg-[#fff0ed] text-[#b9261b]";
  return (
    <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold ${cls}`}>
      {score} / 100
    </span>
  );
}

function StatusIcon({ status }: { status: "pass" | "fail" | "unknown" }) {
  if (status === "pass") {
    return (
      <span
        aria-label="pass"
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)] text-[11px] font-bold"
      >
        ✓
      </span>
    );
  }
  if (status === "fail") {
    return (
      <span
        aria-label="fail"
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff0ed] text-[#b9261b] text-[11px] font-bold"
      >
        ✗
      </span>
    );
  }
  return (
    <span
      aria-label="manual"
      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)] text-[10px] font-bold"
    >
      ?
    </span>
  );
}

function WeightChip({ weight }: { weight: 1 | 2 | 3 }) {
  const label = weight === 3 ? "high" : weight === 2 ? "med" : "low";
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
      w{weight} · {label}
    </span>
  );
}

function AiChip() {
  return (
    <span
      title="Scored by AI — heuristics couldn't decide"
      className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]"
    >
      ai
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-[14px]">{children}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "pass" | "fail" | "manual";
}) {
  const cls =
    tone === "pass"
      ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
      : tone === "fail"
      ? "bg-[#fff0ed] text-[#b9261b]"
      : "bg-[var(--surface-2)] text-[var(--muted)]";
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-full px-3 py-1 ${cls}`}
    >
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.14em]">{label}</span>
    </span>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
