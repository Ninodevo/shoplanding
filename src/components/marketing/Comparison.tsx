import Section from "./Section";

/**
 * Comparison — clean feature table.
 *
 * Replaces the previous mock-screen design (which kept breaking under HMR
 * and looked busy at any width). Now it's a bare-bones feature checklist:
 * every row is one capability, with ✗ for the generic Dawn-style PDP and ✓
 * for ours. Reads in 5 seconds, can't break visually, no absolute pills.
 */

type Row = {
  feature: string;
  generic: { ok: boolean; note?: string };
  ours: { ok: boolean; note?: string };
};

const ROWS: Row[] = [
  {
    feature: "Free-shipping strip + threshold",
    generic: { ok: false },
    ours: { ok: true, note: "$35+ banner, persistent" },
  },
  {
    feature: "Reviews near the CTA",
    generic: { ok: false },
    ours: { ok: true, note: "★★★★★ 4.8 · 487 reviews above the fold" },
  },
  {
    feature: "Bundle & Save quantity discounts",
    generic: { ok: false },
    ours: { ok: true, note: "1× / 2× / 3× with 'Recommended' badge" },
  },
  {
    feature: "Subscribe & Save toggle",
    generic: { ok: false },
    ours: { ok: true, note: "15% off + free shipping" },
  },
  {
    feature: "Express-pay row (Apple / Google / Klarna / Shop)",
    generic: { ok: false },
    ours: { ok: true, note: "All four, below the main CTA" },
  },
  {
    feature: "Sticky ATC on scroll",
    generic: { ok: false },
    ours: { ok: true, note: "Persistent on every block" },
  },
  {
    feature: "Delivery date estimate near CTA",
    generic: { ok: false },
    ours: { ok: true, note: '"Delivery by Thursday, May 14"' },
  },
  {
    feature: "Press / as-seen-in social proof",
    generic: { ok: false },
    ours: { ok: true, note: "Logo strip above benefits" },
  },
  {
    feature: "Variant picker without page reload",
    generic: { ok: true, note: "Sometimes, theme-dependent" },
    ours: { ok: true, note: "Always" },
  },
  {
    feature: "Live activity (X people viewing now)",
    generic: { ok: false },
    ours: { ok: true },
  },
  {
    feature: "Founder-letter section",
    generic: { ok: false },
    ours: { ok: true },
  },
  {
    feature: "Schema.org Product JSON-LD",
    generic: { ok: true },
    ours: { ok: true, note: "Filled from buyer's tweaks" },
  },
];

export default function Comparison() {
  const generic = ROWS.filter((r) => r.generic.ok).length;
  const ours = ROWS.filter((r) => r.ours.ok).length;

  return (
    <Section
      id="compare"
      eyebrow="Without · with"
      title="A generic Shopify theme, vs. ours."
      intro="Same product. Same imagery. Same price. The 12 rows below are what every conversion-tested PDP includes — and what most themes ship without."
    >
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        {/* Sticky header */}
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Capability
          </div>
          <div className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#b9261b]">
            Generic Dawn-style
            <span className="ml-2 font-mono text-[11px] tracking-normal">
              {generic} / {ROWS.length}
            </span>
          </div>
          <div className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-deep)]">
            ShopLanding · skincare preset
            <span className="ml-2 font-mono text-[11px] tracking-normal">
              {ours} / {ROWS.length}
            </span>
          </div>
        </div>

        <ul role="list">
          {ROWS.map((row, i) => (
            <li
              key={row.feature}
              className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] items-start ${
                i !== ROWS.length - 1
                  ? "border-b border-[var(--line-2)]"
                  : ""
              }`}
            >
              <div className="px-5 py-4 text-[15px] text-[var(--ink)]">
                {row.feature}
              </div>
              <Cell ok={row.generic.ok} note={row.generic.note} kind="bad" />
              <Cell ok={row.ours.ok} note={row.ours.note} kind="good" />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 max-w-2xl text-sm text-[var(--muted)]">
        Coverage scoped to the 12 highest-impact CRO rules; the full 69-rule
        playbook on{" "}
        <a
          href="/playbook"
          className="text-[var(--accent-deep)] underline-offset-4 hover:underline"
        >
          /playbook
        </a>{" "}
        is the source of truth.
      </p>
    </Section>
  );
}

function Cell({
  ok,
  note,
  kind,
}: {
  ok: boolean;
  note?: string;
  kind: "bad" | "good";
}) {
  if (!ok) {
    return (
      <div className="px-5 py-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0ed] px-2.5 py-1 text-[12px] font-semibold text-[#b9261b]"
          aria-label="missing"
        >
          <span aria-hidden>⨯</span>
          missing
        </span>
      </div>
    );
  }
  const tint =
    kind === "good"
      ? "bg-[var(--accent-soft)] text-[var(--accent-deep)]"
      : "bg-[var(--surface-2)] text-[var(--ink-2)]";
  return (
    <div className="px-5 py-4">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${tint}`}
      >
        <span aria-hidden>✓</span>
        included
      </span>
      {note && (
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-2)]">
          {note}
        </p>
      )}
    </div>
  );
}
