import Link from "next/link";
import { Footer, Nav } from "@/components/marketing";
import { getPrisma } from "@/lib/db";

export const revalidate = 3600;

export const metadata = {
  title: "Guides — product page CRO, examples, and checklists",
  description:
    "Free guides on product page conversion: the 69-rule CRO checklist, annotated Shopify product page examples, and how to increase your conversion rate.",
  alternates: { canonical: "/guides" },
};

const GUIDES = [
  {
    href: "/guides/product-page-cro-checklist",
    title: "The product page CRO checklist",
    blurb:
      "All 69 rules in one scannable list — structure, gallery, buy box, social proof, boosters, description.",
  },
  {
    href: "/guides/how-to-increase-shopify-conversion-rate",
    title: "How to increase your Shopify conversion rate",
    blurb:
      "The 7 levers in the order a visitor experiences them, with honest benchmarks and an order of operations.",
  },
  {
    href: "/guides/shopify-product-page-examples",
    title: "Shopify product page examples, annotated",
    blurb:
      "Three live, clickable single-product pages — skincare, supplement, gadget — with the decisions worth stealing.",
  },
];

export default async function GuidesIndex() {
  const prisma = getPrisma();
  const blocks = await prisma.block.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, mustInclude: true },
  });

  return (
    <>
      <Nav />
      <main>
        <section className="mk-section">
          <div className="mk-container max-w-3xl">
            <p className="mk-eyebrow">Guides · free</p>
            <h1 className="mk-h1 mt-4">Product page conversion, written down.</h1>
            <p className="mt-6 text-lg text-[var(--ink-2)]">
              Everything here comes from the same 69-rule playbook our themes
              are built against — no gated PDFs, no email walls.
            </p>

            <div className="mt-12 grid gap-4">
              {GUIDES.map((g) => (
                <Link
                  key={g.href}
                  href={g.href}
                  className="mk-card mk-card-accent block"
                >
                  <h2 className="mk-h3">{g.title}</h2>
                  <p className="mt-2 text-[14.5px] text-[var(--ink-2)]">{g.blurb}</p>
                </Link>
              ))}
            </div>

            <h2 className="mk-h3 mt-16">Block deep-dives</h2>
            <p className="mt-2 text-[14.5px] text-[var(--ink-2)]">
              One page per playbook block, with every rule and its pitfalls.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {blocks.map((b, i) => (
                <li key={b.slug}>
                  <Link
                    href={`/playbook/${b.slug}`}
                    className="flex items-baseline gap-2 rounded-lg border border-[var(--line)] bg-[#fffdf8] px-4 py-3 text-[14px] transition-colors hover:border-[var(--accent)]"
                  >
                    <span className="font-mono text-[11px] text-[var(--accent-deep)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {b.name}
                    <span className="ml-auto font-mono text-[10px] text-[var(--muted)]">
                      {Array.isArray(b.mustInclude) ? (b.mustInclude as string[]).length : 0} rules
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
