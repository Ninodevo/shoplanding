import type { ExtractedPage } from "./extract";

/**
 * Heuristic rule definitions. Each rule maps to one row from the original
 * 69-rule playbook and returns one of three outcomes:
 *   - "pass"    — strongly detected
 *   - "fail"    — strongly absent
 *   - "unknown" — the rule needs a judgment call our heuristics can't make
 *
 * Coverage in v1: ~30 of the 69 rules. The rest stay "unknown" — we surface
 * them in the report as "needs manual review" rather than pretending to score
 * them. v1.1 will layer an LLM pass over the unknowns for qualitative scoring.
 *
 * Weight 1–3 reflects relative impact (3 = move-the-needle, 1 = polish).
 */

export type RuleResult = {
  blockSlug: string;
  ruleIndex: number;
  text: string;
  status: "pass" | "fail" | "unknown";
  weight: 1 | 2 | 3;
  note?: string;
  /**
   * True iff the LLM pass overrode the heuristic verdict (always from
   * `unknown` → `pass`/`fail`/still-`unknown` with note). Lets the report
   * badge these rules as AI-reviewed so the user knows where the verdict
   * came from.
   */
  aiAssisted?: boolean;
};

export type RuleDef = {
  blockSlug: string;
  ruleIndex: number;
  text: string;
  weight: 1 | 2 | 3;
  detect: (page: ExtractedPage) => { status: "pass" | "fail" | "unknown"; note?: string };
};

const pass = (note?: string) => ({ status: "pass" as const, note });
const fail = (note?: string) => ({ status: "fail" as const, note });
const unknown = (note?: string) => ({ status: "unknown" as const, note });

export const RULES: RuleDef[] = [
  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · general
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "general",
    ruleIndex: 2,
    text: "Landing page doesn't contain too many outgoing links (clickable logo, full nav, footer)",
    weight: 2,
    detect: (p) =>
      p.outgoingLinkCount <= 8
        ? pass(`${p.outgoingLinkCount} outgoing links`)
        : fail(`${p.outgoingLinkCount} outgoing links — heavy nav/footer leaks attention`),
  },
  {
    blockSlug: "general",
    ruleIndex: 3,
    text: "An option for the visitor to ask questions (live chat, phone)",
    weight: 2,
    detect: (p) =>
      p.textIncludes.liveChat || p.textIncludes.phoneNumber
        ? pass(`${p.textIncludes.liveChat ? "chat" : ""}${p.textIncludes.liveChat && p.textIncludes.phoneNumber ? " + " : ""}${p.textIncludes.phoneNumber ? "phone" : ""}`)
        : fail("No chat widget or phone number found"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · product-overview-above-the-cta-area
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 2,
    text: "Product title is under 65 characters (fits in Google SERP)",
    weight: 1,
    detect: (p) => {
      const t = p.productSchema?.name ?? p.h1Text[0] ?? p.title;
      if (!t) return unknown("Couldn't find a clear product title");
      return t.length <= 65
        ? pass(`${t.length} chars`)
        : fail(`${t.length} chars — gets truncated in Google`);
    },
  },
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 4,
    text: "Product rating shown near the title (linked to reviews)",
    weight: 3,
    detect: (p) =>
      p.starRating !== null
        ? pass(`${p.starRating}/5${p.reviewCount ? ` from ${p.reviewCount} reviews` : ""}`)
        : fail("No star rating detected near the title"),
  },
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 5,
    text: "Short list of key benefits near the main title (checkmark bullets)",
    weight: 2,
    detect: (p) => {
      const checkmarkPattern = /[✓✔☑]/;
      const hasBullets = checkmarkPattern.test(p.h1Text.join(" ") + " " + (p.metaDescription ?? ""));
      // Cheap signal: bodyText is long enough + we have product detection. Manual.
      if (hasBullets) return pass("Checkmark bullets detected");
      return unknown("Hard to detect bullet-list positioning vs h1 from HTML alone");
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · image-gallery
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "image-gallery",
    ruleIndex: 3,
    text: "Gallery contains multiple product photos",
    weight: 3,
    detect: (p) => {
      const count =
        p.productSchema?.imageCount ?? p.productImageCount;
      if (count >= 4) return pass(`${count} product images`);
      if (count >= 2) return pass(`${count} product images — could use more variety`);
      return fail(`Only ${count} product image${count === 1 ? "" : "s"} detected`);
    },
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 4,
    text: "Thumbnail strip for the rest of the photos",
    weight: 1,
    detect: (p) =>
      p.hasGalleryThumbs ? pass() : unknown("Gallery thumbnail markup not detected (could be JS-rendered)"),
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 5,
    text: "Product video in the gallery",
    weight: 2,
    detect: (p) =>
      p.videoCount > 0
        ? pass(`${p.videoCount} video${p.videoCount === 1 ? "" : "s"} embedded`)
        : fail("No product video found"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · cta-area
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "cta-area",
    ruleIndex: 0,
    text: "The main CTA is visible and includes a clear action verb",
    weight: 3,
    detect: (p) => {
      const ctas = p.buttonText.filter((t) =>
        /(add to (cart|bag)|buy now|shop now|get it now|order|checkout)/i.test(t),
      );
      return ctas.length > 0
        ? pass(`"${ctas[0]}"`)
        : fail("No 'Add to cart' / 'Buy now' button text detected");
    },
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 9,
    text: "CTA copy clearly explains what happens next (secure checkout, etc)",
    weight: 1,
    detect: () => unknown("Subjective — manual review recommended"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 10,
    text: "Price visible and prominent",
    weight: 3,
    detect: (p) =>
      p.priceText
        ? pass(`Found ${p.priceText}`)
        : p.productSchema?.price
        ? pass(`Schema price: ${p.productSchema.price} ${p.productSchema.priceCurrency ?? ""}`)
        : fail("No clearly-formatted price found in body or schema"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 13,
    text: "Old + new price visible with discount % on sale items",
    weight: 2,
    detect: (p) =>
      p.hasCompareAtPrice
        ? pass()
        : unknown("No compare-at price detected — may not be on sale, not a fail"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 15,
    text: "Free-shipping mentioned near the CTA",
    weight: 3,
    detect: (p) =>
      p.textIncludes.freeShipping
        ? pass()
        : fail("Free-shipping not mentioned anywhere on the page"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 17,
    text: "Availability indicator (in stock / low stock)",
    weight: 2,
    detect: (p) =>
      p.textIncludes.inStock || p.productSchema?.availability?.includes("InStock")
        ? pass()
        : fail("No in-stock / availability indicator found"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 19,
    text: "Return / money-back guarantee visible",
    weight: 2,
    detect: (p) =>
      p.textIncludes.moneyBackGuarantee || p.textIncludes.returnsPolicy
        ? pass()
        : fail("No money-back guarantee or returns policy mentioned"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 20,
    text: "Express payment options (Apple/Google/PayPal/Shop Pay)",
    weight: 2,
    detect: (p) => {
      const opts: string[] = [];
      if (p.textIncludes.applePay) opts.push("Apple Pay");
      if (p.textIncludes.googlePay) opts.push("Google Pay");
      if (p.textIncludes.paypal) opts.push("PayPal");
      if (p.textIncludes.shopPay) opts.push("Shop Pay");
      return opts.length >= 2
        ? pass(opts.join(", "))
        : opts.length === 1
        ? fail(`Only ${opts[0]} mentioned — add at least one more`)
        : fail("No express-pay options visible");
    },
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 21,
    text: "BNPL / installment option (Klarna / Afterpay)",
    weight: 1,
    detect: (p) => {
      const opts: string[] = [];
      if (p.textIncludes.klarna) opts.push("Klarna");
      if (p.textIncludes.afterpay) opts.push("Afterpay");
      return opts.length > 0
        ? pass(opts.join(", "))
        : fail("No BNPL option visible — optional but lifts AOV");
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · social-proof
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "social-proof",
    ruleIndex: 0,
    text: "Press / 'as seen in' logos for credibility",
    weight: 2,
    detect: (p) =>
      p.hasPressLogos || p.textIncludes.pressLogos
        ? pass()
        : fail("No 'as seen in' or press logo strip detected"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 1,
    text: "Reviews section visible on the page",
    weight: 3,
    detect: (p) =>
      p.hasReviewsSection
        ? pass(p.reviewCount ? `${p.reviewCount} reviews` : "reviews section present")
        : fail("No reviews section detected"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 3,
    text: "Star rating + review count visible",
    weight: 3,
    detect: (p) =>
      p.starRating !== null && p.reviewCount !== null
        ? pass(`${p.starRating}/5 · ${p.reviewCount} reviews`)
        : fail("Star rating + review count not both visible"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 4,
    text: "'Customers viewing now' / weekly sold indicator",
    weight: 1,
    detect: (p) =>
      p.textIncludes.liveActivity
        ? pass()
        : fail("No live-activity / 'X people viewing' indicator"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · conversion-and-aov-boosters
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 1,
    text: "Quantity discounts / bundle offered near CTA",
    weight: 3,
    detect: (p) =>
      p.textIncludes.bundleOffer
        ? pass()
        : fail("No bundle / qty-discount detected — major AOV lever"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 4,
    text: "Urgency triggers (today only, limited time, etc.)",
    weight: 2,
    detect: (p) =>
      p.textIncludes.urgency
        ? pass()
        : fail("No urgency cue detected"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 5,
    text: "Scarcity triggers (only N left in stock)",
    weight: 2,
    detect: (p) =>
      p.textIncludes.scarcity
        ? pass()
        : fail("No scarcity cue detected"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 6,
    text: "Subscribe-and-save offered",
    weight: 2,
    detect: (p) =>
      p.textIncludes.subscribeAndSave
        ? pass()
        : fail("No subscribe-and-save offered — sticky lift for consumables"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · product-description
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "product-description",
    ruleIndex: 5,
    text: "FAQs answered on the page",
    weight: 2,
    detect: (p) =>
      p.hasFaqSection
        ? pass()
        : fail("No FAQ section found"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 6,
    text: "Specs / technical-details table",
    weight: 1,
    detect: (p) =>
      p.hasSpecsTable
        ? pass()
        : fail("No specifications table found"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 7,
    text: "Comparison section vs alternatives",
    weight: 2,
    detect: (p) =>
      p.hasComparisonSection
        ? pass()
        : fail("No comparison-vs-alternatives section"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 8,
    text: "'How to use' / 3-step explainer",
    weight: 1,
    detect: (p) =>
      p.hasStepsSection
        ? pass()
        : fail("No 'how it works' steps section"),
  },
];

export function runRules(page: ExtractedPage): RuleResult[] {
  return RULES.map((r) => {
    const out = r.detect(page);
    return {
      blockSlug: r.blockSlug,
      ruleIndex: r.ruleIndex,
      text: r.text,
      status: out.status,
      weight: r.weight,
      note: out.note,
    };
  });
}
