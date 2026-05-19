import type { AuditResult } from "./score";

/**
 * Maps a scored audit to the best-matching ShopLanding theme. Used by the
 * nurture emails + the post-unlock recommendation card so we recommend the
 * theme that actually fits the audited niche instead of a generic "see all
 * three" link.
 *
 * Detection is intentionally conservative: title + meta description +
 * schemaName keyword match. Misses → `null` and we fall back to the catalog
 * link. False positives are worse than misses (recommending a supplement
 * theme to a skincare brand is louder failure than no recommendation).
 */
export type ThemeRecommendation = {
  themeSlug: "skincare-orelle" | "supplement-vitalstack" | "gadget-aurabud";
  niche: "skincare" | "supplement" | "gadget";
  /** Display label for the email + card copy. */
  label: string;
  href: string;
  reason: string;
};

const KEYWORDS: Record<
  ThemeRecommendation["niche"],
  { themeSlug: ThemeRecommendation["themeSlug"]; label: string; words: RegExp }
> = {
  skincare: {
    themeSlug: "skincare-orelle",
    label: "Skincare · Orelle",
    words:
      /\b(skin(care)?|serum|moisturi[zs]er|cleanser|spf|sunscreen|retinol|hyaluronic|cream|lotion|balm|beauty|cosmetic)\b/i,
  },
  supplement: {
    themeSlug: "supplement-vitalstack",
    label: "Supplement · VitalStack",
    words:
      /\b(supplement|vitamin|protein|collagen|greens?|probiotic|capsule|nootropic|pre[- ]?workout|electrolyte|magnesium|creatine|adaptogen|wellness)\b/i,
  },
  gadget: {
    themeSlug: "gadget-aurabud",
    label: "Gadget · Aurabud",
    words:
      /\b(earbud|headphone|speaker|gadget|device|tracker|wearable|smart\s?(watch|home)|bluetooth|wireless|battery|charger|drone|electronic)\b/i,
  },
};

export function recommendThemeFor(audit: {
  url: string;
  result: AuditResult;
}): ThemeRecommendation | null {
  const haystack = [
    audit.result.page.schemaName,
    audit.result.page.schemaBrand,
    audit.result.page.title,
    audit.result.page.metaDescription,
    audit.url,
  ]
    .filter(Boolean)
    .join(" ");

  for (const [niche, { themeSlug, label, words }] of Object.entries(KEYWORDS) as Array<
    [ThemeRecommendation["niche"], (typeof KEYWORDS)[ThemeRecommendation["niche"]]]
  >) {
    const m = haystack.match(words);
    if (m) {
      return {
        themeSlug,
        niche,
        label,
        href: `/themes/${themeSlug}`,
        reason: `We saw "${m[0]}" in the page — ${label} ships every block this audit measures, scoring 69/69 out of the box.`,
      };
    }
  }
  return null;
}
