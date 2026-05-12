import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/**
 * Disallow private buyer surfaces and dev/admin endpoints. Marketing surfaces
 * (/, /playbook, /showcase, /themes) are crawlable. /preview/* is intentionally
 * unguessable — robots.txt is a polite hint, not a security boundary.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/preview/", "/buy/", "/dev/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
