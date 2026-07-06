import type { ExtractedPage } from "./extract";

/**
 * Heuristic rule definitions. Each rule maps to one row from the 69-rule
 * playbook (sourced from `handoff/project/uploads/checklist.xlsx`, sheet
 * 🛬 Landing page). Each rule returns one of three outcomes:
 *   - "pass"    — strongly detected
 *   - "fail"    — strongly absent
 *   - "unknown" — the rule needs a judgment call our heuristics can't make
 *
 * Coverage: all 69 rules are now declared. Roughly 30 have meaningful
 * heuristics; the remaining ~40 declare `unknown` with a short rationale,
 * and the LLM pass in `llm.ts` re-scores them against the cleaned page
 * text. This is the model: cheap heuristics for the easy stuff, LLM for
 * the qualitative stuff, honest "unknown" when even the LLM is stuck.
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
  // BLOCK · general (4 rules)
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "general",
    ruleIndex: 0,
    text: "The buy button takes the user directly to the checkout (or upsell) and skips the cart page",
    weight: 2,
    detect: () => unknown("Can't trace the buy-button target from a single PDP fetch"),
  },
  {
    blockSlug: "general",
    ruleIndex: 1,
    text: "Sticky navigation with product name, image, sections, availability, price, discount, and CTA",
    weight: 2,
    detect: (p) =>
      p.hasStickyAtcMarkers
        ? pass("Sticky ATC markup detected — content quality needs eyes")
        : unknown("No sticky-bar markup detected; could still exist as JS-rendered widget"),
  },
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
        ? pass(
            `${p.textIncludes.liveChat ? "chat" : ""}${p.textIncludes.liveChat && p.textIncludes.phoneNumber ? " + " : ""}${p.textIncludes.phoneNumber ? "phone" : ""}`,
          )
        : fail("No chat widget or phone number found"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · product-overview-above-the-cta-area (6 rules)
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 0,
    text: "Product titles are descriptive",
    weight: 1,
    detect: (p) => {
      const t = p.productSchema?.name ?? p.h1Text[0] ?? p.title;
      if (!t) return unknown("Couldn't find a clear product title");
      // Heuristic: very short titles (< 12 chars) are usually undescriptive.
      if (t.length < 12) return fail(`Title is only "${t}" — needs more context`);
      return unknown("Title length OK; quality needs human/LLM judgment");
    },
  },
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 1,
    text: "The main product title is visually prominent compared to other content",
    weight: 2,
    detect: (p) =>
      p.h1Count === 1 ? pass("Exactly one H1 — typical prominent title pattern") : p.h1Count === 0 ? fail("No H1 detected") : unknown(`${p.h1Count} H1s — prominence depends on rendering`),
  },
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 2,
    text: "Product title is under 65 characters (fits in Google SERP)",
    weight: 1,
    detect: (p) => {
      const t = p.productSchema?.name ?? p.h1Text[0] ?? p.title;
      if (!t) return unknown("Couldn't find a clear product title");
      return t.length <= 65 ? pass(`${t.length} chars`) : fail(`${t.length} chars — gets truncated in Google`);
    },
  },
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 3,
    text: "Subtitle highlights key benefits and uses power words (effortless, unique, exclusive, etc.)",
    weight: 1,
    detect: () => unknown("Subjective — LLM judges power-word presence in headline area"),
  },
  {
    blockSlug: "product-overview-above-the-cta-area",
    ruleIndex: 4,
    text: "Product rating shown near the title (linked to reviews)",
    weight: 3,
    detect: (p) =>
      p.starRating !== null
        ? pass(`${p.starRating}/5${p.reviewCount ? ` from ${p.reviewCount} reviews` : ""}`)
        : p.reviewApp
        ? unknown(`${p.reviewApp} detected — its rating widget renders client-side; verify it sits near the title`)
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
      if (hasBullets) return pass("Checkmark bullets detected");
      return unknown("Hard to detect bullet-list positioning vs h1 from HTML alone");
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · image-gallery (9 rules)
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "image-gallery",
    ruleIndex: 0,
    text: "Page layout is standardized (gallery left, description + CTA right)",
    weight: 2,
    detect: () => unknown("Layout topology needs rendered DOM — LLM judges from text flow"),
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 1,
    text: "The main product photo is attractive",
    weight: 2,
    detect: () => unknown("Image quality is subjective — manual review"),
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 2,
    text: "Main photo supports zoom (especially on mobile)",
    weight: 1,
    detect: () => unknown("Zoom is a JS interaction — not visible in static HTML"),
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 3,
    text: "Gallery contains multiple product photos",
    weight: 3,
    detect: (p) => {
      const count = p.productSchema?.imageCount ?? p.productImageCount;
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
      p.videoCount > 0 ? pass(`${p.videoCount} video${p.videoCount === 1 ? "" : "s"} embedded`) : fail("No product video found"),
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 6,
    text: "Gallery contains arrows / navigation between images",
    weight: 1,
    detect: () => unknown("Arrow UI is a JS widget — not visible in static HTML"),
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 7,
    text: "Gallery supports swipe on mobile",
    weight: 1,
    detect: () => unknown("Swipe gestures are runtime — not visible in static HTML"),
  },
  {
    blockSlug: "image-gallery",
    ruleIndex: 8,
    text: "Variant-aware imagery (different photos per variant/size)",
    weight: 2,
    detect: () => unknown("Variant-image binding lives in JS state — manual review"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · cta-area (23 rules)
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "cta-area",
    ruleIndex: 0,
    text: "The main CTA is the most visible element and contains a cart icon",
    weight: 3,
    detect: (p) => {
      const ctas = p.buttonText.filter((t) =>
        /(add to (cart|bag)|buy now|shop now|get it now|order|checkout)/i.test(t),
      );
      return ctas.length > 0 ? pass(`"${ctas[0]}"`) : fail("No 'Add to cart' / 'Buy now' button text detected");
    },
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 1,
    text: "Product variants are easily accessible on mobile with enough whitespace",
    weight: 1,
    detect: () => unknown("Mobile touch-target spacing needs rendered viewport"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 2,
    text: "Variant selection is connected to the gallery (shows the chosen variant)",
    weight: 2,
    detect: () => unknown("JS-bound — manual review required"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 3,
    text: "Reminder appears if the user clicks ATC before selecting size/colour",
    weight: 1,
    detect: () => unknown("JS validation behaviour — not visible in static HTML"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 4,
    text: "Interactive selectors for product variants (price + gallery update in real-time)",
    weight: 1,
    detect: () => unknown("Real-time update behaviour — JS state, manual review"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 5,
    text: "Size chart link near size selectors (opens in a popup)",
    weight: 1,
    detect: (p) => (p.textIncludes.sizeChart ? pass("Size-chart link detected") : unknown("No size-chart link found — may not be apparel")),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 6,
    text: "Localized units shown (cm/in, kg/lb)",
    weight: 1,
    detect: () => unknown("Locale-dependent and JS-rendered — manual review"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 7,
    text: "Model size + product size mentioned (apparel only)",
    weight: 1,
    detect: () => unknown("Apparel-specific — LLM judges if the niche fits"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 8,
    text: "Interactive quantity selector instead of a dropdown",
    weight: 1,
    detect: () => unknown("Selector widget type — manual review"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 9,
    text: "CTA copy clearly explains what happens next (secure checkout, etc)",
    weight: 1,
    detect: (p) => {
      const explanatory = p.buttonText.find((t) => /(secure|checkout|continue|proceed)/i.test(t));
      return explanatory
        ? pass(`"${explanatory}"`)
        : unknown("CTA copy is generic — LLM judges if it explains the next step");
    },
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
    ruleIndex: 11,
    text: "Price is placed near the main CTA",
    weight: 2,
    detect: () => unknown("DOM proximity needs rendered layout — manual review"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 12,
    text: "Price is localized to the visitor's currency",
    weight: 1,
    detect: () => unknown("Geo-detection JS behaviour — manual review"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 13,
    text: "Old + new price visible with discount % on sale items",
    weight: 2,
    detect: (p) =>
      p.hasCompareAtPrice ? pass() : unknown("No compare-at price detected — may not be on sale, not a fail"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 14,
    text: "Additional charges (taxes, oversized shipping) shown near the CTA",
    weight: 1,
    detect: () => unknown("Surcharge disclosures vary — LLM judges from CTA-area text"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 15,
    text: "Free-shipping mentioned near the CTA",
    weight: 3,
    detect: (p) =>
      p.textIncludes.freeShipping ? pass() : fail("Free-shipping not mentioned anywhere on the page"),
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 16,
    text: "Shipping info shown near the CTA (delivery time, country, flag)",
    weight: 2,
    detect: () => unknown("Shipping-strip content needs DOM proximity — LLM judges"),
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
    ruleIndex: 18,
    text: "Old (strike-through) price with new price + how much customers save",
    weight: 2,
    detect: (p) =>
      p.hasCompareAtPrice
        ? pass("Strike-through / compare-at price detected")
        : unknown("Not on sale — N/A unless discounting"),
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
      if (opts.length >= 2) return pass(opts.join(", "));
      // Shopify dynamic checkout renders wallets client-side — the static
      // wrapper markup is the reliable signal.
      if (p.hasExpressCheckoutMarkers)
        return pass("Shopify dynamic-checkout wallet markup detected (Shop Pay / Apple Pay / Google Pay render client-side)");
      return opts.length === 1
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
      if (opts.length > 0) return pass(opts.join(", "));
      if (p.hasBnplMarkers)
        return pass("BNPL placement markup detected (Shopify installments / Klarna / Afterpay widget)");
      return fail("No BNPL option visible — optional but lifts AOV");
    },
  },
  {
    blockSlug: "cta-area",
    ruleIndex: 22,
    text: "Trust strip with brand-level benefits (vegan, cruelty-free, charity, units shipped)",
    weight: 1,
    detect: () => unknown("Trust-strip copy varies — LLM judges from full text"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · social-proof (8 rules)
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "social-proof",
    ruleIndex: 0,
    text: "Press / 'as seen in' logos for credibility",
    weight: 2,
    detect: (p) =>
      p.hasPressLogos || p.textIncludes.pressLogos ? pass() : fail("No 'as seen in' or press logo strip detected"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 1,
    text: "Reviews shown with title, customer photo, star rating, verified buyer, occupation, age",
    weight: 3,
    detect: (p) =>
      p.hasReviewsSection
        ? pass(p.reviewCount ? `${p.reviewCount} reviews — content depth needs eyes` : "Reviews section present")
        : p.reviewApp
        ? pass(`${p.reviewApp} installed — widget renders client-side; review depth needs eyes`)
        : fail("No reviews section detected"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 2,
    text: "Reviews visually stand out (e.g. on a soft yellow background)",
    weight: 1,
    detect: () => unknown("Visual contrast — needs rendered styles"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 3,
    text: "Page contains photos (with faces) of happy customers using the product",
    weight: 2,
    detect: () => unknown("Face detection isn't in scope — LLM judges from gallery alt text"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 4,
    text: "Star rating + review count visible, filterable by star",
    weight: 3,
    detect: (p) =>
      p.starRating !== null && p.reviewCount !== null
        ? pass(`${p.starRating}/5 · ${p.reviewCount} reviews`)
        : p.reviewApp
        ? unknown(`${p.reviewApp} detected — rating renders client-side; check filterability manually`)
        : fail("Star rating + review count not both visible"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 5,
    text: "Cumulative buyer counts ('19,222 customers this month')",
    weight: 1,
    detect: (p) => {
      const m = /(\d{1,3}(?:,\d{3})+|\d{4,})\s+(?:customers|products|orders|shipped|sold)/i.exec(
        p.bodyTextSnippet,
      );
      return m ? pass(`Matched "${m[0]}"`) : unknown("No 'X customers/orders' pattern found");
    },
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 6,
    text: "Video testimonials embedded",
    weight: 2,
    detect: (p) =>
      p.videoCount > 0 && p.hasReviewsSection
        ? unknown(`${p.videoCount} videos + reviews present — LLM checks if any are testimonials`)
        : fail("Either no videos or no reviews section — testimonials unlikely"),
  },
  {
    blockSlug: "social-proof",
    ruleIndex: 7,
    text: "Facebook / Twitter follower counts shown",
    weight: 1,
    detect: () => unknown("Rarely on PDPs — LLM judges from footer/sidebar text"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · conversion-and-aov-boosters (9 rules)
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 0,
    text: "Post-ATC upsell offering a second item cheaper",
    weight: 2,
    detect: () => unknown("Post-cart flow — not visible from PDP fetch"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 1,
    text: "Quantity discounts / bundle offered near CTA",
    weight: 3,
    detect: (p) =>
      p.textIncludes.bundleOffer ? pass() : fail("No bundle / qty-discount detected — major AOV lever"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 2,
    text: "Relevant cross-sell / up-sell products shown",
    weight: 2,
    detect: (p) => {
      if (/(you may also like|frequently bought|complete the look|complementary|related products|customers also)/i.test(p.bodyTextSnippet)) {
        return pass("Cross-sell section heading detected");
      }
      return unknown("No clear cross-sell heading found");
    },
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 3,
    text: "Relevant bundle products offered with prominent discounts",
    weight: 2,
    detect: (p) =>
      p.textIncludes.bundleOffer ? pass("Bundle markers found — LLM verifies discount prominence") : unknown("No bundle section detected"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 4,
    text: "Urgency triggers (today only, limited time, etc.)",
    weight: 2,
    detect: (p) => (p.textIncludes.urgency ? pass() : fail("No urgency cue detected")),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 5,
    text: "Scarcity triggers (only N left in stock)",
    weight: 2,
    detect: (p) => (p.textIncludes.scarcity ? pass() : fail("No scarcity cue detected")),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 6,
    text: "Live activity — people viewing / bought in last 24h",
    weight: 2,
    detect: (p) =>
      p.textIncludes.liveActivity ? pass() : fail("No live-activity / 'X people viewing' indicator"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 7,
    text: "Charitable giving / percentage-of-profit mention",
    weight: 1,
    detect: (p) =>
      /(charity|donate|donat\w+|give[- ]?back|nonprofit|1% for the planet)/i.test(p.bodyTextSnippet)
        ? pass("Charity/give-back language detected")
        : unknown("No charity / give-back language found"),
  },
  {
    blockSlug: "conversion-and-aov-boosters",
    ruleIndex: 8,
    text: "'Visitors also viewed' section with complementary or alternative products",
    weight: 1,
    detect: (p) =>
      /(visitors who viewed|customers also viewed|you may also like|related products)/i.test(p.bodyTextSnippet)
        ? pass()
        : unknown("No 'also viewed' section text found"),
  },

  // ────────────────────────────────────────────────────────────────────────
  // BLOCK · product-description (10 rules)
  // ────────────────────────────────────────────────────────────────────────
  {
    blockSlug: "product-description",
    ruleIndex: 0,
    text: "Description is easy to read (font size, contrast, single column, 75 chars/line, 1.5 line-height)",
    weight: 2,
    detect: () => unknown("Typography rendering — manual / Lighthouse territory"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 1,
    text: "Information structure is scannable (grouped, bullets, highlighted benefits)",
    weight: 2,
    detect: () => unknown("Scannability is structural — LLM judges from body text"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 2,
    text: "Long sections grouped in accordions (especially on mobile)",
    weight: 1,
    detect: () => unknown("Accordion components vary — manual review"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 3,
    text: "Section titles explain benefits (not features)",
    weight: 2,
    detect: () => unknown("Subjective — perfect LLM task: read headings, judge tone"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 4,
    text: "All included items shown (with a photo)",
    weight: 1,
    detect: () => unknown("'What's in the box' coverage — LLM judges from text"),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 5,
    text: "FAQs answered on the page",
    weight: 2,
    detect: (p) => (p.hasFaqSection ? pass() : fail("No FAQ section found")),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 6,
    text: "Specs / technical-details table",
    weight: 1,
    detect: (p) => (p.hasSpecsTable ? pass() : fail("No specifications table found")),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 7,
    text: "Comparison section vs alternatives",
    weight: 2,
    detect: (p) => (p.hasComparisonSection ? pass() : fail("No comparison-vs-alternatives section")),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 8,
    text: "'How to use' / 3-step explainer",
    weight: 1,
    detect: (p) => (p.hasStepsSection ? pass() : fail("No 'how it works' steps section")),
  },
  {
    blockSlug: "product-description",
    ruleIndex: 9,
    text: "Embedded social reviews / screenshots (FB, IG, Twitter, WhatsApp)",
    weight: 1,
    detect: () => unknown("Embedded social posts — LLM judges from gallery alt text"),
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
