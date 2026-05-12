type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  surface?: "default" | "tinted" | "dark";
  children: React.ReactNode;
};

export default function Section({
  id,
  eyebrow,
  title,
  intro,
  align = "left",
  surface = "default",
  children,
}: SectionProps) {
  const surfaceClass =
    surface === "tinted"
      ? "bg-[var(--surface)]"
      : surface === "dark"
        ? "mk-hero"
        : "";
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  return (
    <section
      id={id}
      className={`mk-section ${surfaceClass}`.trim()}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="mk-container">
        {(eyebrow || title || intro) && (
          <header
            className={`max-w-2xl ${alignClass} mb-12 sm:mb-16`.trim()}
          >
            {eyebrow && (
              <p
                className={`mk-eyebrow ${
                  surface === "dark" ? "mk-eyebrow-on-dark" : ""
                }`.trim()}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                id={id ? `${id}-title` : undefined}
                className={`mk-h2 mt-3 ${
                  surface === "dark" ? "text-[var(--hero-ink)]" : ""
                }`.trim()}
              >
                {title}
              </h2>
            )}
            {intro && (
              <p
                className={`mt-4 text-lg ${
                  surface === "dark"
                    ? "text-[var(--hero-ink-2)]"
                    : "text-[var(--ink-2)]"
                }`.trim()}
              >
                {intro}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
