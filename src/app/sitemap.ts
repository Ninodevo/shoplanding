import type { MetadataRoute } from "next";
import { getPrisma } from "@/lib/db";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/**
 * Sitemap — Next 16 generates `/sitemap.xml` from this. We surface only the
 * public marketing/discovery surfaces. /preview, /buy/success, /api/* are
 * excluded (private buyer flow / non-discoverable).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const prisma = getPrisma();

  const [presets, themes] = await Promise.all([
    prisma.layoutPreset.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.theme.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/audit`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/playbook`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/showcase`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const showcaseEntries: MetadataRoute.Sitemap = presets.map((p) => ({
    url: `${SITE_URL}/showcase/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const themeEntries: MetadataRoute.Sitemap = themes.map((t) => ({
    url: `${SITE_URL}/themes/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticEntries, ...showcaseEntries, ...themeEntries];
}
