import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Type system — "the conversion lab".
 * Fraunces (display serif, optical sizing + real italics) carries every
 * headline; Instrument Sans does body work; JetBrains Mono is the
 * annotation voice (eyebrows, spec rows, rule numbers). The pairing is the
 * brand: an engineered, documented system — not another Inter SaaS page.
 */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const TITLE = "ShopLanding — High-converting product pages for Shopify + WooCommerce";
const DESCRIPTION =
  "A one-product landing page built on 69 documented CRO rules. Shopify theme + WooCommerce plugin + portable system spec. €99 one-time, lifetime updates. Free PDP audit at /audit.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · ShopLanding",
  },
  description: DESCRIPTION,
  applicationName: "ShopLanding",
  keywords: [
    "Shopify theme",
    "WooCommerce plugin",
    "single product landing page",
    "product page audit",
    "PDP audit",
    "CRO playbook",
    "Conversion optimization",
    "DTC",
  ],
  authors: [{ name: "Nino Mihovilić" }],
  creator: "Nino Mihovilić",
  publisher: "ShopLanding",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ShopLanding",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: { icon: "/favicon.ico" },
};

/**
 * Site-wide Organization JSON-LD. Helps Google build a knowledge panel and
 * makes the brand discoverable for "ShopLanding" branded searches once we
 * start ranking. Founder is named so the Person entity wires up to LinkedIn
 * / X if those get added later.
 */
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ShopLanding",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description: DESCRIPTION,
  founder: {
    "@type": "Person",
    name: "Nino Mihovilić",
  },
  foundingLocation: {
    "@type": "Place",
    name: "Zagreb, Croatia",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@shoplanding.com",
    areaServed: "Worldwide",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]">
        {children}
        <script
          type="application/ld+json"
          // Structured data must be inline JSON; dangerouslySetInnerHTML is the
          // standard Next.js pattern. Content is fully static, no XSS surface.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
      </body>
    </html>
  );
}
