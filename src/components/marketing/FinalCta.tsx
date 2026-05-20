import Link from "next/link";
import { FINAL_CTA } from "@/lib/marketing/copy";

export default function FinalCta() {
  return (
    <section className="mk-hero relative overflow-hidden">
      <div className="mk-container py-24 text-center sm:py-28">
        <p className="mk-eyebrow mk-eyebrow-on-dark">{FINAL_CTA.eyebrow}</p>
        <h2 className="mk-h2 mx-auto mt-4 max-w-2xl text-[var(--hero-ink)]">
          {FINAL_CTA.headline}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[var(--hero-ink-2)]">
          {FINAL_CTA.sub}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={FINAL_CTA.ctaPrimaryHref} className="mk-btn mk-btn-primary">
            {FINAL_CTA.ctaPrimary}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/playbook"
            className="mk-btn mk-btn-ghost-on-dark"
          >
            {FINAL_CTA.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
