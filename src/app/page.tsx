import {
  AnnouncementBar,
  AnnotatedProof,
  Comparison,
  Faq,
  FinalCta,
  Footer,
  Hero,
  Nav,
  Pricing,
  StickyCta,
  ThemeCatalog,
} from "@/components/marketing";

export const revalidate = 600;

/**
 * Marketing home — Option A · Catalog.
 * Hero stack → theme catalog grid → annotated proof → without/with comparison
 * → pricing → FAQ → final CTA. Eight surfaces, no manifesto.
 */
export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Nav />
      <main>
        <Hero />
        <ThemeCatalog />
        <AnnotatedProof />
        <Comparison />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
