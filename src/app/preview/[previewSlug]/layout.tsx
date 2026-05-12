import "@/components/landing/landing.css";

/**
 * Route segment for `/preview/[previewSlug]` — same font setup as
 * `/showcase/[slug]/layout.tsx`. Loads Fraunces + Inter + JetBrains Mono so
 * any preset's font choice resolves. The handoff CSS scopes via `.landing-root`,
 * so it doesn't leak into the marketing chrome around the page.
 */
export default function PreviewSlugLayout({
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
