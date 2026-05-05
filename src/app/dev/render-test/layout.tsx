import "@/components/landing/landing.css";

/**
 * Dev-only route segment for the landing renderer. Imports the verbatim
 * handoff CSS so we can verify the port matches the design 1:1. The fonts
 * (Fraunces, Inter, JetBrains Mono) come from Google Fonts via a `<link>`.
 */
export default function RenderTestLayout({
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
