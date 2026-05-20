import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/**
 * Disallow private buyer surfaces and dev/admin endpoints. Marketing surfaces
 * (/, /playbook, /showcase, /themes, /audit, /about, /contact, etc.) are
 * crawlable. /preview/* + /account/* are intentionally unguessable —
 * robots.txt is a polite hint, not a security boundary.
 *
 * /audit/[id]/ is disallowed (audit results are noindex'd at the page level
 * via metadata.robots; this is belt + suspenders so individual audits don't
 * compete for the brand SERP).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/audit/",
          "/preview/",
          "/buy/",
          "/account/",
          "/auth/",
          "/dev/",
        ],
      },
      // The audit landing page itself must stay crawlable — only the per-id
      // result pages are excluded above.
      { userAgent: "*", allow: "/audit" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
