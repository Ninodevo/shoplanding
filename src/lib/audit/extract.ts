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
  /**
   * True when the HTML came from a rendered browser (deep audit) rather
   * than a static fetch. Flips the epistemics downstream: absence from a
   * rendered DOM IS evidence of absence, so rules and the LLM may fail
   * what they'd otherwise leave at "unknown".
   */
  rendered: boolean;

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

  /**
   * App-marker signals detected in the RAW HTML (script srcs, widget class
   * prefixes). Most Shopify stores render reviews / wallets / BNPL via JS
   * apps whose content never appears in static HTML — without these
   * markers the heuristics fail those stores unfairly.
   */
  reviewApp: string | null;
  hasExpressCheckoutMarkers: boolean;
  hasBnplMarkers: boolean;
  /**
   * Non-null when the page ships a slide-out/drawer cart (theme-native or a
   * cart app like Rebuy/UpCart). Means add-to-cart opens the drawer rather
   * than going straight to checkout — decisive for the direct-to-checkout
   * rule. Value names what we found.
   */
  cartDrawer: string | null;

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
   * True when the storefront renders most of its media client-side (JS
   * framework storefronts: most <img> tags carry template bindings instead
   * of src attributes). Downstream rules must not hard-fail "X not found"
   * checks on such pages — absence in static HTML proves nothing.
   */
  looksClientRendered: boolean;

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
  /** From ProductGroup.hasVariant (Shopify's newer JSON-LD shape) or offer count. */
  variantCount: number | null;
};

export function extractPage(args: {
  html: string;
  url: string;
  finalUrl: string;
  /** Set true when `html` is a rendered-browser DOM (deep audit). */
  rendered?: boolean;
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
  const domProductImageCount = images.filter((el) => {
    // Check src plus the common lazy-load attributes
    const src =
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("srcset") ||
      $(el).attr("data-srcset") ||
      "";
    const alt = ($(el).attr("alt") || "").toLowerCase();
    // Heuristic: "product" in alt, or CDN paths like /products/, /cdn/shop/products/
    return (
      /product/.test(alt) ||
      /\/products\//.test(src) ||
      /shop\/products/.test(src)
    );
  }).length;
  // Gallery-container counting: modern Shopify serves product media from
  // /cdn/shop/files/ (not /products/), so path matching misses it — but the
  // images sit inside gallery-classed containers. Distinct srcs only, so a
  // desktop+mobile duplicate doesn't double-count.
  const galleryImgSrcs = new Set<string>();
  $("[class*='gallery' i] img, [class*='product-media' i] img, [data-media-id] img").each(
    (_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (src) galleryImgSrcs.add(src.split("?")[0]!);
    },
  );

  // JS-framework storefronts (Vue/React hydration) render the real content
  // client-side; rules must not hard-fail what static HTML can't show.
  // Three tells, any one suffices:
  //   1. Most <img> tags carry template bindings instead of src.
  //   2. No H1 at all — every server-rendered PDP has one.
  //   3. No attributable product image — a PDP's gallery is only invisible
  //      statically when a JS framework mounts it (Brooklinen: 0 static,
  //      110 rendered).
  const imagesWithAnySrc = images.filter(
    (el) => $(el).attr("src") || $(el).attr("data-src") || $(el).attr("srcset"),
  ).length;
  const looksClientRendered =
    (images.length >= 10 && imagesWithAnySrc / images.length < 0.5) ||
    h1s.length === 0 ||
    Math.max(domProductImageCount, galleryImgSrcs.size) === 0;
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
  const rawLower = args.html.toLowerCase();
  const hasStickyAtcMarkers =
    /sticky[-_ ]?atc|add[-_ ]to[-_ ]cart[-_ ]sticky|sticky[-_ ]bar|sticky[-_ ]?cart|upcart/.test(
      rawLower,
    );

  // ── Review-app markers. Widget content renders client-side, but the app's
  // script tags / class prefixes are in the static HTML. First match wins.
  const REVIEW_APPS: Array<[string, RegExp]> = [
    ["Bazaarvoice", /bazaarvoice|data-bv-show/],
    ["Judge.me", /jdgm|judge\.me/],
    ["Loox", /loox/],
    ["Yotpo", /yotpo/],
    ["Okendo", /okendo/],
    ["Stamped", /stamped[.-]?io|stamped-/],
    ["REVIEWS.io", /reviews\.io|ruk_rating/],
    ["Junip", /junip/],
    ["Opinew", /opinew/],
    ["Rivyo", /rivyo/],
    ["Ali Reviews", /alireviews|ali-reviews/],
  ];
  const reviewApp =
    REVIEW_APPS.find(([, re]) => re.test(rawLower))?.[0] ?? null;

  // Shopify dynamic checkout renders wallet buttons (Shop Pay / Apple Pay /
  // Google Pay / PayPal) client-side; the container markup is static.
  const hasExpressCheckoutMarkers =
    /shopify-payment-button|dynamic-checkout|shop-pay-wallet|accelerated-checkout/.test(
      rawLower,
    );

  // BNPL placement wrappers (Shopify installments banner, Klarna/Afterpay
  // on-site messaging) — again static wrappers around JS content.
  const hasBnplMarkers =
    /shopify-installments|klarna[-_ ]?placement|afterpay[-_ ]?placement|data-sezzle|sezzle-widget/.test(
      rawLower,
    );

  // Drawer/sidebar cart: cart-app markers first (they name the app), then
  // theme-native drawer markup. Presence means ATC opens the drawer instead
  // of going straight to checkout.
  const CART_DRAWER_APPS: Array<[string, RegExp]> = [
    ["Rebuy Smart Cart", /rebuy-cart/],
    ["UpCart", /upcart/],
    ["Slide Cart", /slidecart|slide[-_ ]cart/],
    ["Monster Cart", /monster[-_ ]?cart/],
  ];
  const cartDrawer =
    CART_DRAWER_APPS.find(([, re]) => re.test(rawLower))?.[0] ??
    (/<cart-drawer|id="cartdrawer"|cart-drawer|cart__drawer|drawer--cart|mini-?cart|cart-sidebar|cart-flyout|ajax-cart|cart-popup|cart-notification/.test(
      rawLower,
    )
      ? "theme cart drawer"
      : null);
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
    // Rendered review widgets often carry the rating only in aria-labels
    // ("4.8 out of 5 stars"), so fall back to the raw HTML after body text.
    const m =
      bodyText.match(/(\d\.\d)\s*(?:\/|out of)\s*5/) ??
      rawLower.match(/(\d\.\d)\s*(?:\/|out of)\s*5/);
    if (m) starRating = parseFloat(m[1]!);
  }
  if (reviewCount === null) {
    const m =
      bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:verified )?reviews?\b/) ??
      rawLower.match(/(\d{1,3}(?:,\d{3})*)\s*(?:verified )?reviews?\b/);
    if (m) reviewCount = parseInt(m[1]!.replace(/,/g, ""), 10);
  }

  // ── Price text — schema price is the source of truth. The body-text
  // fallback must skip currency figures that are actually shipping rates
  // ("$3.99 flat rate shipping") — grabbing the first match burned us.
  let priceText: string | null = null;
  if (productSchema?.price !== null && productSchema?.price !== undefined) {
    const sym =
      { USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "AU$" }[
        productSchema.priceCurrency ?? ""
      ] ?? (productSchema.priceCurrency ? `${productSchema.priceCurrency} ` : "$");
    priceText = `${sym}${productSchema.price}`;
  } else {
    for (const m of bodyText.matchAll(/[\$€£¥]\s?\d{1,3}(?:[.,]\d{2})?/g)) {
      const ctx = bodyText.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
      if (/shipping|delivery|ship free|freight/.test(ctx)) continue;
      priceText = m[0];
      break;
    }
  }
  // "compare at" / strikethrough price (any of: schema, <s>, <del>, "was $X")
  const hasCompareAtPrice =
    (productSchema && productSchema.price !== null && /compare/.test(bodyText)) ||
    $("s, del, .price--compare, .price__compare, [class*='strike' i]").length > 0 ||
    /\bwas \$|\bwas €|\bwas £/.test(bodyText);

  return {
    url: args.url,
    finalUrl: args.finalUrl,
    rendered: args.rendered ?? false,
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
    // Whichever source saw more — path/alt heuristic, gallery containers,
    // or the schema image list.
    productImageCount: Math.max(
      domProductImageCount,
      galleryImgSrcs.size,
      productSchema?.imageCount ?? 0,
    ),
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
    reviewApp,
    hasExpressCheckoutMarkers,
    hasBnplMarkers,
    cartDrawer,
    textIncludes,
    starRating,
    reviewCount,
    priceText,
    hasCompareAtPrice,
    bodyTextLength: bodyText.length,
    looksClientRendered,
    // The deep audit pays for itself — give the LLM a deeper read there.
    bodyTextSnippet: bodyText.slice(0, args.rendered ? 20000 : 8000),
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
  const types = Array.isArray(t) ? t : [t];
  // ProductGroup is Shopify's newer PDP shape: group-level name/brand with
  // the sellable Products nested under hasVariant. Treat it as the product
  // node — shapeProduct knows how to mine the variants.
  if (types.includes("Product") || types.includes("ProductGroup")) {
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
  // ProductGroup: sellable Products live under hasVariant. Mine variants
  // for offers/images/ratings the group node itself doesn't carry.
  const variants = (Array.isArray(o.hasVariant) ? o.hasVariant : []).filter(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
  );

  // Collect candidate offers: the node's own, then each variant's. Prefer
  // an InStock offer (Shopify lists sold-out variants first sometimes).
  const offerCandidates: Record<string, unknown>[] = [];
  for (const node of [o, ...variants]) {
    const offers = node.offers as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined;
    if (Array.isArray(offers)) offerCandidates.push(...offers.filter((x) => typeof x === "object" && x !== null));
    else if (offers && typeof offers === "object") offerCandidates.push(offers);
  }
  const firstOffer =
    offerCandidates.find((of) => /InStock/i.test(String(of.availability ?? ""))) ??
    offerCandidates[0];
  const offerPrice = firstOffer?.price;
  const offerCurrency = firstOffer?.priceCurrency;
  const offerAvail = firstOffer?.availability;

  // Rating: node's own aggregateRating, else first variant that has one.
  const agg = ([o, ...variants]
    .map((n) => n.aggregateRating)
    .find((a) => a && typeof a === "object")) as Record<string, unknown> | undefined;

  // Images: union of the node's image field and every variant's (deduped).
  const imageUrls = new Set<string>();
  for (const node of [o, ...variants]) {
    const imagesField = node.image;
    if (typeof imagesField === "string") imageUrls.add(imagesField);
    else if (Array.isArray(imagesField)) {
      for (const img of imagesField) {
        if (typeof img === "string") imageUrls.add(img);
        else if (img && typeof img === "object") {
          const u = (img as Record<string, unknown>).url;
          if (typeof u === "string") imageUrls.add(u);
        }
      }
    }
  }

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
    imageCount: imageUrls.size,
    variantCount: variants.length > 0 ? variants.length : offerCandidates.length > 1 ? offerCandidates.length : null,
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
