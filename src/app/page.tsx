import {
  AnnouncementBar,
  AnnotatedProof,
  Comparison,
  Faq,
  FinalCta,
  Footer,
  Founder,
  Hero,
  Nav,
  Pricing,
  StickyCta,
  ThemeCatalog,
} from "@/components/marketing";

export const revalidate = 600;

/**
 * Marketing home.
 * Hero → catalog → annotated proof → comparison → founder strip → pricing →
 * FAQ → final CTA. The Founder strip lands right before pricing on purpose:
 * the visitor is about to make a buying decision, so that's the moment they
 * most need to see there's a real person behind the brand.
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
        <Founder />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
