import { ANNOUNCEMENT } from "@/lib/marketing/copy";

export default function AnnouncementBar() {
  const items = [...ANNOUNCEMENT, ...ANNOUNCEMENT];
  return (
    <div className="overflow-hidden bg-[var(--accent-deep)] text-white">
      <div
        className="mk-marquee-track px-6 text-[12px] uppercase tracking-[0.16em]"
        aria-hidden
      >
        {items.map((label, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300"
              aria-hidden
            />
            {label}
          </span>
        ))}
      </div>
      <span className="sr-only">{ANNOUNCEMENT.join(". ")}</span>
    </div>
  );
}
