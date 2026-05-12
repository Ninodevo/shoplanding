import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
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

const TITLE = "ShopLanding — The system for converting one-product landing pages";
const DESCRIPTION =
  "Seven CRO blocks. Sixty-nine rules. Twenty rendered components. Shipped as Shopify and WooCommerce themes plus a portable system spec. From $99 one-time.";

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
    "WooCommerce theme",
    "single product landing page",
    "CRO playbook",
    "Conversion optimization",
    "DTC",
  ],
  authors: [{ name: "ShopLanding" }],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
