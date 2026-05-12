import "@/components/landing/landing.css";

/**
 * Route segment for `/showcase/[slug]` — loads the landing renderer's CSS
 * and the three Google fonts every preset might need (Fraunces for skincare's
 * serif headlines, Inter for body and supplement/gadget headlines, JetBrains
 * Mono for labels). The handoff CSS scopes via `.landing-root`, so it doesn't
 * leak into the marketing surfaces above.
 */
export default function ShowcaseSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
