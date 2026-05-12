"use client";

import Section from "./Section";
import { FAQS } from "@/lib/marketing/copy";

export default function Faq() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="The questions buyers ask before paying."
    >
      <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-white">
        {FAQS.map((f, i) => (
          <li key={f.q}>
            <details className="group">
              <summary className="flex cursor-pointer items-start justify-between gap-6 px-6 py-5 text-[16px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface)] [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-4">
                  <span className="mk-mono w-6 shrink-0 text-[var(--muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{f.q}</span>
                </span>
                <span
                  className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="px-6 pb-6 pl-16 text-[15px] leading-relaxed text-[var(--ink-2)]">
                {f.a}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}
