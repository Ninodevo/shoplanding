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
 * Marketing home.
 * Hero → catalog → annotated proof → comparison → pricing → FAQ → final CTA.
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
