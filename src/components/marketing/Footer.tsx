import Link from "next/link";
import { FOOTER } from "@/lib/marketing/copy";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mk-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
        <div>
          <Link href="/" className="flex items-center gap-2 text-[var(--ink)]">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink)] text-white"
              aria-hidden
            >
              <span className="block h-2 w-2 rounded-sm bg-[var(--accent)]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              ShopLanding
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[var(--ink-2)]">
            The block system, CRO playbook, and Shopify themes for
            high-converting one-product landing pages.
          </p>
        </div>
        {FOOTER.cols.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="mk-mono text-[var(--muted)]">{col.heading}</p>
            <ul className="mt-4 space-y-2 text-[14px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="mk-container flex flex-wrap items-center justify-between gap-3 py-6 text-[12px] text-[var(--muted)]">
          <span>© {new Date().getFullYear()} ShopLanding</span>
          <span>One product. One page. One decision.</span>
        </div>
      </div>
    </footer>
  );
}
