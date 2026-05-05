import Link from "next/link";
import { getPrisma } from "@/lib/db";

export const metadata = {
  title: "Playbook — ShopLanding",
  description:
    "The block-by-block CRO system for single-product landing pages. Every rule is sourced from the Conversion.design landing page checklist and mapped to a rendered component.",
};

const PLACEMENT_LABEL: Record<string, string> = {
  "persistent-top": "Persistent (top)",
  "persistent-bottom": "Persistent (bottom)",
  "sticky-on-scroll": "Sticky on scroll",
  "in-flow": "In flow",
};

const PLACEMENT_DOT: Record<string, string> = {
  "persistent-top": "bg-emerald-500",
  "persistent-bottom": "bg-blue-500",
  "sticky-on-scroll": "bg-amber-500",
  "in-flow": "bg-neutral-400",
};

export default async function PlaybookPage() {
  const prisma = getPrisma();
  const [blocks, rendered] = await Promise.all([
    prisma.block.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.renderedBlock.findMany({ orderBy: { position: "asc" } }),
  ]);

  // Reverse map: which rendered components satisfy each playbook block.
  const byBlockSlug = new Map<string, typeof rendered>();
  for (const r of rendered) {
    const slugs = Array.isArray(r.satisfies) ? (r.satisfies as string[]) : [];
    for (const s of slugs) {
      const arr = byBlockSlug.get(s) ?? [];
      arr.push(r);
      byBlockSlug.set(s, arr);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <Header />

      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          The 7 CRO blocks
        </h2>
        <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">
          Each block groups a set of conversion rules from the Conversion.design
          landing-page checklist. A rendered component satisfies one or more
          blocks.
        </p>

        <ul className="mt-8 space-y-10">
          {blocks.map((b) => {
            const rules = Array.isArray(b.mustInclude)
              ? (b.mustInclude as string[])
              : [];
            const renderedFor = byBlockSlug.get(b.slug) ?? [];
            return (
              <li
                key={b.id}
                className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-semibold">{b.name}</h3>
                  <span className="text-xs text-neutral-500">
                    {rules.length} rules
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {b.purpose}
                </p>

                {renderedFor.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {renderedFor.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium dark:bg-neutral-900"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${PLACEMENT_DOT[r.placement] ?? "bg-neutral-400"}`}
                        />
                        {r.name}
                      </span>
                    ))}
                  </div>
                )}

                <ol className="mt-6 list-decimal space-y-2 pl-6 text-sm text-neutral-700 dark:text-neutral-300">
                  {rules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">
          The {rendered.length} rendered components
        </h2>
        <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">
          Visual order matches the canonical landing template. Every component
          links back to one or more CRO blocks above.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {rendered.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs dark:bg-neutral-900">
                  {String(r.position + 1).padStart(2, "0")}
                </span>
                <h3 className="font-semibold">{r.name}</h3>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${PLACEMENT_DOT[r.placement] ?? "bg-neutral-400"}`}
                />
                {PLACEMENT_LABEL[r.placement] ?? r.placement}
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <code className="font-mono">{r.componentName}</code>
              </div>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                {r.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(Array.isArray(r.satisfies) ? (r.satisfies as string[]) : []).map(
                  (slug) => {
                    const b = blocks.find((x) => x.slug === slug);
                    return (
                      <span
                        key={slug}
                        className="rounded bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-950 dark:text-neutral-300 dark:ring-neutral-800"
                      >
                        {b?.name ?? slug}
                      </span>
                    );
                  },
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-24 border-t border-neutral-200 pt-8 text-sm text-neutral-500 dark:border-neutral-800">
        <Link href="/" className="underline-offset-4 hover:underline">
          ← Back to ShopLanding
        </Link>
      </footer>
    </main>
  );
}

function Header() {
  return (
    <header>
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        Playbook
      </p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        How an optimized single-product landing page is built.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
        Two layers. The CRO <strong>blocks</strong> are the rules — what every
        section must contain to convert. The <strong>rendered components</strong>{" "}
        are how those rules show up on screen. Every theme we sell ships every
        component below, configured to satisfy every rule above.
      </p>
    </header>
  );
}
