import Link from "next/link";
import { getPrisma } from "@/lib/db";

export default async function HomePage() {
  const prisma = getPrisma();
  const [blockCount, renderedCount, blocks] = await Promise.all([
    prisma.block.count(),
    prisma.renderedBlock.count(),
    prisma.block.findMany({ select: { mustInclude: true } }),
  ]);
  const ruleCount = blocks.reduce(
    (n, b) => n + (Array.isArray(b.mustInclude) ? b.mustInclude.length : 0),
    0,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-24">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        ShopLanding
      </p>
      <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
        Sell one product. <br />
        Convert like ten stores.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
        A block-by-block system for single-product landing pages, packaged as
        Shopify and WooCommerce themes. Every block is mapped to the CRO rules
        it satisfies, so you know <em>why</em> the page is shaped the way it is.
      </p>

      <div className="mt-10 flex gap-3">
        <Link
          href="/playbook"
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          Read the playbook
        </Link>
        <Link
          href="/showcase"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          See examples
        </Link>
      </div>

      <dl className="mt-16 grid grid-cols-3 gap-6 border-t border-neutral-200 pt-10 dark:border-neutral-800">
        <Stat label="CRO blocks" value={blockCount} />
        <Stat label="Rendered components" value={renderedCount} />
        <Stat label="Conversion rules" value={ruleCount} />
      </dl>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="text-4xl font-semibold tracking-tight">{value}</dd>
      <dt className="mt-1 text-sm text-neutral-500">{label}</dt>
    </div>
  );
}
