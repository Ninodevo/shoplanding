import * as cheerio from "cheerio";

/**
 * Parse a fetched HTML page into a structured object the scoring engine can
 * reason about without re-parsing for every rule. Designed to be conservative
 * with detection — false positives are worse than misses on a public audit
 * tool because they erode credibility.
 */
export type ExtractedPage = {
  url: string;
  finalUrl: string;

  // Head
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;

  // Schema.org Product JSON-LD (the gold standard for PDP data)
  productSchema: ProductSchema | null;

  // Visible structure counts
  h1Count: number;
  h1Text: string[];
  buttonCount: number;
  buttonText: string[];
  imageCount: number;
  imagesWithAlt: number;
  productImageCount: number;
  videoCount: number;
  formCount: number;
  outgoingLinkCount: number;
  internalLinkCount: number;

  // Section presence
  hasReviewsSection: boolean;
  hasFaqSection: boolean;
  hasComparisonSection: boolean;
  hasIngredientsSection: boolean;
  hasStepsSection: boolean;
  hasSpecsTable: boolean;
  hasStickyAtcMarkers: boolean;
  hasGalleryThumbs: boolean;
  hasPressLogos: boolean;

  // Text presence (lowercased, full-body keyword search)
  textIncludes: {
    freeShipping: boolean;
    moneyBackGuarantee: boolean;
    returnsPolicy: boolean;
    inStock: boolean;
    applePay: boolean;
    googlePay: boolean;
    paypal: boolean;
    shopPay: boolean;
    klarna: boolean;
    afterpay: boolean;
    bundleOffer: boolean;
    subscribeAndSave: boolean;
    sizeChart: boolean;
    urgency: boolean;
    scarcity: boolean;
    liveActivity: boolean;
    liveChat: boolean;
    phoneNumber: boolean;
    pressLogos: boolean;
  };

  // Numeric signals
  starRating: number | null;
  reviewCount: number | null;
  priceText: string | null;
  hasCompareAtPrice: boolean;
  bodyTextLength: number;

  /**
   * Cleaned, lower-cased body text truncated to ~8 KB. Fed to the LLM pass
   * for the qualitative ("manual review") rules. Not used by heuristics —
   * heuristics work off the structured fields above.
   */
  bodyTextSnippet: string;
};

export type ProductSchema = {
  name: string | null;
  description: string | null;
  brand: string | null;
  price: number | null;
  priceCurrency: string | null;
  availability: string | null;
  ratingValue: number | null;
  reviewCount: number | null;
  imageCount: number;
};

export function extractPage(args: {
  html: string;
  url: string;
  finalUrl: string;
}): ExtractedPage {
  const $ = cheerio.load(args.html);
  const baseOrigin = safeOrigin(args.finalUrl);

  // ── Head
  const title = $("head > title").first().text().trim() || null;
  const metaDescription =
    $('head meta[name="description"]').attr("content")?.trim() || null;
  const canonical = $('head link[rel="canonical"]').attr("href")?.trim() || null;

  // ── Schema.org Product JSON-LD (search all <script type="application/ld+json">)
  const productSchema = extractProductSchema($);

  // ── Body text — once, for keyword searches
  const bodyText = $("body").text().replace(/\s+/g, " ").toLowerCase();

  // ── Counts
  const h1s = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const buttons = $("button, [role='button'], input[type='submit'], a.btn, a[class*='btn']")
    .map((_, el) => $(el).text().trim() || $(el).attr("value") || "")
    .get()
    .filter(Boolean);
  const images = $("img").get();
  const imagesWithAlt = images.filter((el) => {
    const alt = $(el).attr("alt");
    return alt !== undefined && alt.trim().length > 0;
  }).length;
  const productImageCount = images.filter((el) => {
    const src = $(el).attr("src") || "";
    const alt = ($(el).attr("alt") || "").toLowerCase();
    // Heuristic: "product" in alt, or CDN paths like /products/, /cdn/shop/products/
    return (
      /product/.test(alt) ||
      /\/products\//.test(src) ||
      /shop\/products/.test(src)
    );
  }).length;
  const videoCount = $("video, iframe[src*='youtube'], iframe[src*='vimeo'], iframe[src*='wistia']").length;
  const formCount = $("form").length;

  let outgoing = 0;
  let internal = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }
    const linkOrigin = safeOrigin(href, baseOrigin);
    if (linkOrigin && baseOrigin && linkOrigin !== baseOrigin) outgoing++;
    else internal++;
  });

  // ── Section presence (DOM + text-driven)
  const hasReviewsSection =
    $("[id*='review' i], [class*='review' i]").length > 0 ||
    /reviews?\s*\(?\d/.test(bodyText);
  const hasFaqSection =
    $("[id*='faq' i], [class*='faq' i]").length > 0 ||
    /frequently asked questions/.test(bodyText);
  const hasComparisonSection =
    /compar(e|ison)/.test(bodyText) &&
    ($("table").length > 0 || /vs\.?\s/.test(bodyText));
  const hasIngredientsSection =
    /(ingredients?|what'?s inside|what is inside)/.test(bodyText);
  const hasStepsSection =
    /(step 1|3 steps|how it works|three steps)/.test(bodyText);
  const hasSpecsTable =
    $("table").length > 0 &&
    /(spec(ification|s)|dimensions|weight|materials)/.test(bodyText);
  const hasStickyAtcMarkers =
    /sticky[-_ ]?atc|add[-_ ]to[-_ ]cart[-_ ]sticky|sticky[-_ ]bar/.test(
      args.html.toLowerCase(),
    );
  const hasGalleryThumbs =
    $("[class*='thumb' i], [class*='gallery' i] [class*='nav' i]").length > 0;
  const hasPressLogos =
    /(as\s+(seen|featured)\s+in|as\s+seen\s+on|featured in)/.test(bodyText) ||
    $("[class*='press' i], [class*='as-seen' i]").length > 0;

  // ── Text keyword presence
  const textIncludes = {
    freeShipping: /(free shipping|free delivery)/.test(bodyText),
    moneyBackGuarantee: /(money[- ]back|refund guarantee|satisfaction guarantee)/.test(bodyText),
    returnsPolicy: /(returns? policy|free returns?|30[- ]day return)/.test(bodyText),
    inStock: /(in stock|available now|ships within|in-stock)/.test(bodyText),
    applePay: /apple\s?pay/.test(bodyText),
    googlePay: /google\s?pay/.test(bodyText),
    paypal: /paypal/.test(bodyText),
    shopPay: /shop\s?pay/.test(bodyText),
    klarna: /klarna/.test(bodyText),
    afterpay: /(afterpay|after pay)/.test(bodyText),
    bundleOffer: /(bundle|2[- ]pack|3[- ]pack|quantity discount|buy 2 get|buy 3)/.test(bodyText),
    subscribeAndSave: /(subscribe (and|&) save|subscription save|recurring delivery)/.test(bodyText),
    sizeChart: /size (chart|guide)/.test(bodyText),
    urgency: /(today only|limited time|ends in|sale ends|hurry|order in the next|black friday)/.test(bodyText),
    scarcity: /(only \d+ (left|in stock)|low stock|almost gone|selling fast)/.test(bodyText),
    liveActivity: /(people (are|currently) (viewing|looking)|customers (viewed|bought) recently|\d+ sold (today|this))/.test(bodyText),
    liveChat: /(live chat|chat with us|message us|whatsapp)/.test(bodyText),
    phoneNumber: /(?:\+|\bcall us\b|\bcall:|\btel:)\s?\d/.test(bodyText),
    pressLogos: hasPressLogos,
  };

  // ── Rating + review count (prefer schema, fall back to text patterns)
  let starRating = productSchema?.ratingValue ?? null;
  let reviewCount = productSchema?.reviewCount ?? null;
  if (starRating === null) {
    const m = bodyText.match(/(\d\.\d)\s*(?:\/|out of)\s*5/);
    if (m) starRating = parseFloat(m[1]!);
  }
  if (reviewCount === null) {
    const m = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:verified )?reviews?\b/);
    if (m) reviewCount = parseInt(m[1]!.replace(/,/g, ""), 10);
  }

  // ── Price text (any explicit currency-marked number in body)
  const priceMatch = bodyText.match(/[\$€£¥]\s?\d{1,3}(?:[.,]\d{2})?/);
  const priceText = priceMatch ? priceMatch[0] : null;
  // "compare at" / strikethrough price (any of: schema, <s>, <del>, "was $X")
  const hasCompareAtPrice =
    (productSchema && productSchema.price !== null && /compare/.test(bodyText)) ||
    $("s, del, .price--compare, .price__compare, [class*='strike' i]").length > 0 ||
    /\bwas \$|\bwas €|\bwas £/.test(bodyText);

  return {
    url: args.url,
    finalUrl: args.finalUrl,
    title,
    metaDescription,
    canonical,
    productSchema,
    h1Count: h1s.length,
    h1Text: h1s,
    buttonCount: buttons.length,
    buttonText: buttons,
    imageCount: images.length,
    imagesWithAlt,
    productImageCount,
    videoCount,
    formCount,
    outgoingLinkCount: outgoing,
    internalLinkCount: internal,
    hasReviewsSection,
    hasFaqSection,
    hasComparisonSection,
    hasIngredientsSection,
    hasStepsSection,
    hasSpecsTable,
    hasStickyAtcMarkers,
    hasGalleryThumbs,
    hasPressLogos,
    textIncludes,
    starRating,
    reviewCount,
    priceText,
    hasCompareAtPrice,
    bodyTextLength: bodyText.length,
    bodyTextSnippet: bodyText.slice(0, 8000),
  };
}

function extractProductSchema($: cheerio.CheerioAPI): ProductSchema | null {
  const scripts = $('script[type="application/ld+json"]').get();
  for (const el of scripts) {
    const raw = $(el).text().trim();
    if (!raw) continue;
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const found = findProductNode(data);
    if (found) return shapeProduct(found);
  }
  return null;
}

function findProductNode(data: unknown): Record<string, unknown> | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const f = findProductNode(item);
      if (f) return f;
    }
    return null;
  }
  if (typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const t = obj["@type"];
  if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) {
    return obj;
  }
  // Recurse into @graph (common in Yoast / RankMath output)
  const graph = obj["@graph"];
  if (Array.isArray(graph)) {
    for (const item of graph) {
      const f = findProductNode(item);
      if (f) return f;
    }
  }
  return null;
}

function shapeProduct(o: Record<string, unknown>): ProductSchema {
  const offers = o.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  const firstOffer = Array.isArray(offers) ? offers[0] : offers;
  const offerPrice = firstOffer?.price;
  const offerCurrency = firstOffer?.priceCurrency;
  const offerAvail = firstOffer?.availability;
  const agg = o.aggregateRating as Record<string, unknown> | undefined;
  const imagesField = o.image;
  let imageCount = 0;
  if (typeof imagesField === "string") imageCount = 1;
  else if (Array.isArray(imagesField)) imageCount = imagesField.length;

  const brand = o.brand;
  const brandName =
    typeof brand === "string"
      ? brand
      : typeof brand === "object" && brand !== null
        ? (brand as Record<string, unknown>).name as string | undefined ?? null
        : null;

  return {
    name: (o.name as string) ?? null,
    description: (o.description as string) ?? null,
    brand: brandName ?? null,
    price: typeof offerPrice === "number" ? offerPrice : typeof offerPrice === "string" ? parseFloat(offerPrice) : null,
    priceCurrency: typeof offerCurrency === "string" ? offerCurrency : null,
    availability: typeof offerAvail === "string" ? offerAvail : null,
    ratingValue: agg && agg.ratingValue !== undefined ? Number(agg.ratingValue) : null,
    reviewCount: agg && agg.reviewCount !== undefined ? parseInt(String(agg.reviewCount), 10) : null,
    imageCount,
  };
}

function safeOrigin(href: string, base?: string | null): string | null {
  try {
    const u = base ? new URL(href, base) : new URL(href);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}
