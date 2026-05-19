"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { NAV_LINKS } from "@/lib/marketing/copy";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Smooth-scroll handler. NAV_LINKS hrefs are absolute (`/#themes` etc) so
   * they work from any route. When the user is already on `/` and the target
   * exists, intercept the click and `scrollIntoView` smoothly — guarantees
   * smooth behavior regardless of how the browser handles the CSS rule.
   * On other routes, let the browser do the full navigation; smooth CSS
   * applies after the new page paints.
   */
  const onAnchorClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname !== "/") return; // navigate normally
    const hashIdx = href.indexOf("#");
    if (hashIdx < 0) return;
    const id = href.slice(hashIdx + 1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Keep the hash in the URL so reload / share preserves the position.
    history.replaceState(null, "", `#${id}`);
    setOpen(false);
  };

  return (
    <header
      data-scrolled={scrolled}
      className="sticky top-0 z-30 transition-colors data-[scrolled=true]:border-b data-[scrolled=true]:border-[var(--line)] data-[scrolled=true]:bg-white/80 data-[scrolled=true]:backdrop-blur-md"
    >
      <div className="mk-container flex h-16 items-center justify-between">
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

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => onAnchorClick(e, l.href)}
              className="text-[14px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/audit"
            className="hidden text-[14px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] sm:block"
          >
            Audit
          </Link>
          <Link
            href="/playbook"
            className="hidden text-[14px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] sm:block"
          >
            Playbook
          </Link>
          <Link
            href="/account/downloads"
            className="hidden text-[14px] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] sm:block"
            aria-label="Account · sign in to manage downloads"
          >
            Account
          </Link>
          <a
            href="/#pricing"
            onClick={(e) => onAnchorClick(e, "/#pricing")}
            className="mk-btn mk-btn-primary !py-2 text-[13px]"
          >
            See pricing
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)]"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span className="block h-px w-4 bg-[var(--ink)]" />
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="border-t border-[var(--line)] bg-white px-6 py-4 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => onAnchorClick(e, l.href)}
                  className="block py-1 text-[15px] text-[var(--ink-2)]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
