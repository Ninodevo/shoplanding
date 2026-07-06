/**
 * Static marketing copy. Hand-written per AGENTS.md (no AI-generated copy on
 * marketing surfaces). Keep tone: confident, not theatrical. Match the brand
 * voice in docs/product.md and docs/pricing.md.
 *
 * Currency: EUR. The Lemon Squeezy store is EUR-denominated (Croatian d.o.o.
 * is the seller, LS is merchant of record). Showing $ here while charging €
 * at checkout was a credibility leak — fixed Phase 13.
 */

export const HERO = {
  eyebrow: "Free 15-second audit · Shopify + WooCommerce",
  headline: "A high-converting product page, live this weekend.",
  sub: "Drop in your brand, your photos, your copy — ship a one-product landing page built on 69 documented CRO rules. Shopify theme + WooCommerce plugin, €99 once, you keep the updates.",
  ctaPrimary: "Audit your store — free",
  ctaPrimaryHref: "/audit",
  ctaSecondary: "See the themes",
  ctaSecondaryHref: "#themes",
  trustLine: "Seven blocks · sixty-nine rules · twenty components",
} as const;

export const ANNOUNCEMENT = [
  "Free PDP audit · score in 15 seconds",
  "Shopify + WooCommerce · lifetime updates",
  "One product. One page. One decision.",
  "One-time license. No subscription.",
] as const;

/* Anchor hrefs are absolute (`/#…`) so the nav works from any route — clicking
   "Pricing" on /showcase navigates home and then scrolls to #pricing.
   Kept deliberately short — three items + one CTA. Compare / Proof / FAQ live
   on the home page; the visitor finds them by scrolling. The audit lives in
   the primary right-side CTA, not the left list. */
export const NAV_LINKS = [
  { href: "/#themes", label: "Themes" },
  { href: "/playbook", label: "Playbook" },
  { href: "/#pricing", label: "Pricing" },
] as const;

/* ============================================================
   Theme catalog cards. The `price` / `was` / `annText` fields
   are the FICTIONAL brand-demo prices (the made-up Orelle /
   VitalStack / Aurabud products) and stay in $ — they represent
   each demo brand's pricing on the mock-PDP, not OUR pricing
   for the theme. Our pricing (single/unlimited/setup) is in €.
   ============================================================ */
export type ThemeCatalogEntry = {
  slug: string;
  name: string;
  /** Niche label for the heading badge ("Skincare", "Supplement", "Gadget"). */
  niche: string;
  /** One-line positioning under the name. */
  positioning: string;
  /** Tag pills shown under the positioning. */
  badges: string[];
  /** CSS class on the inner mock to switch palette ("preset-skincare" etc). */
  presetClass: "preset-skincare" | "preset-supplement" | "preset-gadget";
  /** URL bar text on the chrome. */
  url: string;
  /** Front-mock announcement text. */
  annText: string;
  /** Front-mock CTA copy. */
  ctaText: string;
  /** Sale tag in the front buy box. */
  pillText: string;
  /** Visible price + strikethrough on the front. */
  price: number;
  was?: number;
  /** Single-store license price (in EUR cents). */
  priceSingleCents: number;
};

export const THEME_CATALOG: ThemeCatalogEntry[] = [
  {
    slug: "skincare",
    name: "Orelle",
    niche: "Skincare",
    positioning: "Pocketable solid lotion. Cream paper, sage accent.",
    badges: ["Skincare", "Shopify", "Subscription"],
    presetClass: "preset-skincare",
    url: "orelle.com",
    annText: "FREE SHIPPING $35+",
    ctaText: "+ Add to bag",
    pillText: "Daily Essentials",
    price: 39,
    was: 49,
    priceSingleCents: 9900,
  },
  {
    slug: "supplement",
    name: "VitalStack",
    niche: "Supplement",
    positioning: "Daily greens stick. Dark-mode default, neon-green CTAs.",
    badges: ["Supplement", "Shopify", "Bundle"],
    presetClass: "preset-supplement",
    url: "vitalstack.io",
    annText: "SUBSCRIBE · SAVE 20%",
    ctaText: "START SUBSCRIPTION",
    pillText: "DAILY · 30 SERVINGS",
    price: 48,
    was: 60,
    priceSingleCents: 9900,
  },
  {
    slug: "gadget",
    name: "Aurabud",
    niche: "Gadget",
    positioning: "Single-SKU earbud. Steel-grey, electric-blue, spec-table heavy.",
    badges: ["Gadget", "Shopify", "Spec table"],
    presetClass: "preset-gadget",
    url: "aurabud.co",
    annText: "FREE 2-DAY SHIPPING",
    ctaText: "Add to cart",
    pillText: "Gen 2 · 2026",
    price: 129,
    priceSingleCents: 9900,
  },
];

/* Annotated proof — the rule list shown by the side panel when a pin is active. */
export type ProofPin = {
  n: number;
  title: string;
  blockLabel: string;
  summary: string;
  rules: { num: number; text: string }[];
};

export const PROOF_PINS: ProofPin[] = [
  {
    n: 1,
    title: "Hero buy box.",
    blockLabel: "Block 4 / 7 · CTA area",
    summary:
      "The block doing the most work on the page. 23 of the 69 CRO rules apply here. We hit the high-impact ones by default.",
    rules: [
      { num: 25, text: "The main CTA is the most visible element on the product page and contains the cart icon." },
      { num: 29, text: "Interactive variant selectors — gallery image and price update without page reload." },
      { num: 35, text: "Price prominent — especially when discounted." },
      { num: 40, text: "Free shipping highlighted near the main CTA." },
      { num: 59, text: "Quantity discounts with 'Recommended' / 'Best value' badges." },
    ],
  },
  {
    n: 2,
    title: "Press / As-seen-in.",
    blockLabel: "Block 6 / 7 · Social proof",
    summary:
      "Logo strip of publications that featured the product or brand — the first social-proof block on the page.",
    rules: [
      { num: 49, text: "Press exposure logos — Vogue, goop, Forbes, etc." },
    ],
  },
  {
    n: 3,
    title: "Benefits grid.",
    blockLabel: "Block 7 / 7 · Product description",
    summary:
      "Four cards translating features into customer benefits. Section titles must lead with benefits, not specs.",
    rules: [
      { num: 68, text: "Easy to read — single column, ≤75 chars per line, line-height 1.5." },
      { num: 71, text: "Section titles explain benefits, not features." },
      { num: 72, text: "Show all things included with photos." },
    ],
  },
  {
    n: 4,
    title: "Reviews.",
    blockLabel: "Block 6 / 7 · Social proof",
    summary:
      "All 8 social-proof rules trigger here — star distribution, photo evidence, verified badges, occupation.",
    rules: [
      { num: 50, text: "Reviews show photos, ratings, name, occupation, age, verified badge." },
      { num: 51, text: "Reviews stand out visually — slightly tinted background." },
      { num: 53, text: "Star ratings filterable." },
      { num: 52, text: "Customer photos with the product." },
    ],
  },
];

export type PricingTier = {
  id: "single" | "unlimited" | "setup";
  eyebrow: string;
  name: string;
  priceCents: number;
  cadence: string;
  highlight?: boolean;
  bullets: string[];
  ctaLabel: string;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "single",
    eyebrow: "For founders",
    name: "Single-store license",
    priceCents: 9900,
    cadence: "one-time · lifetime updates",
    bullets: [
      "One Shopify or WooCommerce store",
      "Shopify theme + Woo plugin + system spec",
      "Tweaks panel + personalized preview",
      "Lifetime updates for that store",
    ],
    ctaLabel: "Buy single-store",
  },
  {
    id: "unlimited",
    eyebrow: "For operators & agencies",
    name: "Unlimited-stores license",
    priceCents: 24900,
    cadence: "one-time · lifetime updates",
    highlight: true,
    bullets: [
      "Everything in single-store",
      "Use across unlimited stores you operate",
      "Resell client builds without a re-license",
      "Priority on niche-preset releases",
    ],
    ctaLabel: "Buy unlimited",
  },
  {
    id: "setup",
    eyebrow: "Add-on",
    name: "Done-for-you setup",
    priceCents: 19900,
    cadence: "one-time add-on",
    bullets: [
      "We install the theme on your store",
      "Wire payments + shipping + inventory",
      "Five sections of copy from your brief",
      "One round of revisions",
    ],
    ctaLabel: "Request setup",
  },
];

export type Faq = {
  q: string;
  a: string;
};

export const FAQS: Faq[] = [
  {
    q: "Do I need to know how to code?",
    a: "No for everything you'd change in a Shopify theme editor — brand, palette, fonts, hero copy, product photos, benefits, FAQ items, all surface through the tweaks panel. If your developer wants to dig deeper, the zip ships clean Shopify Liquid (Online Store 2.0) and the portable system spec includes the full component anatomy.",
  },
  {
    q: "Shopify or WooCommerce — which one do I get?",
    a: "Both, in one license. The Shopify theme (the flagship) uploads via Online Store → Themes → Upload zip. The WooCommerce artifact is a plugin — it drops into whatever theme you already run, registers a \"ShopLanding — Product Landing\" page template, and wires the page to your product. No theme switch on the WordPress side.",
  },
  {
    q: "What about my product photos and brand assets?",
    a: "You bring them — the tweaks panel takes URLs from any public CDN (Shopify, Cloudinary, S3, even Imgur), slots them into the gallery, hero, benefits grid, and reviews. We don't host images for you, so the page stays fast and you keep your asset rights.",
  },
  {
    q: "Will this work for my niche?",
    a: "Yes for any single-product launch where the customer is making one decision: skincare, supplements, food and CPG, candles, single-SKU gadgets, accessories. We ship niche presets so the defaults match the category. Outside of single-product? Reply before you buy — we'll be honest about whether the system fits.",
  },
  {
    q: "How is this different from a Shopify Theme Store theme?",
    a: "Theme Store themes position on visuals. ShopLanding positions on conversion logic. Every block exists for a documented reason — a row from the 69-rule playbook. Most $30 themes ship 5–6 of those rules out of the box; ours ships every one of the 69.",
  },
  {
    q: "Is this a page builder?",
    a: "No. The block order is opinionated and fixed — only content and visual tokens change between themes. The reason is conversion: every block exists for a documented reason, and rearranging them silently breaks the rule coverage. If you want infinite flexibility, you want Shogun or Replo; if you want a page that converts on day one, you want this.",
  },
  {
    q: "Who handles VAT / sales tax?",
    a: "Lemon Squeezy — they're the merchant of record on every sale. EU buyers see VAT added at checkout at their country's rate, US buyers see sales tax in taxable states, UK buyers see UK VAT. You don't register, file, or remit anything. We get a clean EUR payout.",
  },
  {
    q: "Can my agency rebuild the system on a different stack?",
    a: "Yes. The unlimited-stores license includes a portable system spec (JSON + Markdown) so a competent team can reimplement the same anatomy in Hydrogen, Astro, Webflow, or anywhere else. The 69 rules + the block ordering are the IP; the implementation is interchangeable.",
  },
  {
    q: "Do I get updates after I buy?",
    a: "Lifetime updates for the stores covered by your license. No subscription, no upgrade cycle, no scarcity timers. When a new niche preset lands you get the relevant ones for free.",
  },
  {
    q: "What's the refund policy?",
    a: "14-day refund on the digital license, no questions asked — Lemon Squeezy processes it. The done-for-you setup add-on is refundable until installation work begins.",
  },
];

export const FINAL_CTA = {
  eyebrow: "Ready when you are",
  headline: "Ship a product page that actually converts.",
  sub: "€99 single-store · €249 unlimited · one-time, lifetime updates, refundable for 14 days.",
  ctaPrimary: "Audit your store first",
  ctaPrimaryHref: "/audit",
  ctaSecondary: "Read the playbook",
} as const;

export const FOOTER = {
  cols: [
    {
      heading: "System",
      links: [
        { label: "Themes", href: "/themes" },
        { label: "Playbook", href: "/playbook" },
        { label: "Showcase", href: "/showcase" },
        { label: "Free audit", href: "/audit" },
      ],
    },
    {
      heading: "Account",
      links: [
        { label: "My downloads", href: "/account/downloads" },
        { label: "Sign in", href: "/auth/sign-in" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { label: "Refund policy", href: "/refund" },
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
      ],
    },
  ],
} as const;

/** EUR cents → display string. */
export function priceLabel(cents: number): string {
  const euros = cents / 100;
  return `€${euros.toFixed(0)}`;
}
