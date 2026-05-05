import LandingRenderer from "@/components/landing/LandingRenderer";
import {
  DEFAULT_CONTENT,
  DEFAULT_TOKENS,
} from "@/components/landing/defaultContent";

export const metadata = {
  title: "Render test — ShopLanding dev",
  description:
    "Renders the canonical LandingTemplate via <LandingRenderer> using the default content fixture. Used to verify the port against the handoff design.",
  robots: { index: false, follow: false },
};

export default function RenderTestPage() {
  return (
    <LandingRenderer content={DEFAULT_CONTENT} tokens={DEFAULT_TOKENS} />
  );
}
