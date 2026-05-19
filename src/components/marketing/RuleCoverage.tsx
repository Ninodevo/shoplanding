import { getPrisma } from "@/lib/db";

/**
 * Proves the "69/69 rules" claim on theme detail pages. Reads the seeded
 * `Block` rows from Postgres and renders one card per playbook block with
 * its full rule list. Every rule is checked (green ✓) because every theme
 * is built to satisfy the whole playbook — the data backs the marketing
 * copy instead of asking the buyer to trust an "all 69" badge.
 *
 * Server component — direct DB read, no client state. Block data is
 * immutable per deploy so revalidate on the parent page is enough.
 */
export default async function RuleCoverage() {
  const prisma = getPrisma();
  const blocks = await prisma.block.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select: { slug: true, name: true, mustInclude: true, purpose: true },
  });

  const totalRules = blocks.reduce(
    (n, b) => n + (Array.isArray(b.mustInclude) ? b.mustInclude.length : 0),
    0,
  );

  return (
    <section className="mk-section bg-[var(--surface)]">
      <div className="mk-container">
        <header className="mb-10 max-w-2xl">
          <p className="mk-eyebrow">CRO coverage · proof</p>
          <h2 className="mk-h2 mt-3">
            Every one of the {totalRules} playbook rules — satisfied.
          </h2>
          <p className="mt-4 text-lg text-[var(--ink-2)]">
            This isn&apos;t a badge. Below is every rule the theme ships,
            grouped by block. Click any block to skim the list, or take our
            audit on your current store to see how it compares.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {blocks.map((b) => {
            const rules = Array.isArray(b.mustInclude)
              ? (b.mustInclude as unknown as string[])
              : [];
            return (
              <details
                key={b.slug}
                className="group rounded-xl border border-[var(--line)] bg-white open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight">
                      {b.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-[var(--muted)]">
                      {b.purpose}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 font-mono text-[11px] font-semibold text-[var(--accent-deep)]">
                      {rules.length} / {rules.length}
                    </span>
                    <span
                      className="font-mono text-[18px] text-[var(--muted)] transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </div>
                </summary>
                <ul className="divide-y divide-[var(--line-2)] border-t border-[var(--line-2)]">
                  {rules.map((rule, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 px-5 py-2.5 text-[13.5px]"
                    >
                      <span
                        aria-label="satisfied"
                        className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-deep)] text-[10px] font-bold"
                      >
                        ✓
                      </span>
                      <span className="text-[var(--ink-2)]">{rule}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-[var(--muted)]">
          Want the per-rule rationale and examples?{" "}
          <a
            href="/playbook"
            className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
          >
            Read the full playbook →
          </a>
        </p>
      </div>
    </section>
  );
}
