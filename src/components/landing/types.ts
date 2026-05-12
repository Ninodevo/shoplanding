/**
 * Typed content schema for `<LandingRenderer>`. All copy, imagery, pricing,
 * and reviews flow through this object. A `LayoutPreset` row in the DB holds
 * one of these (plus tokens) as its `demoSeed`; an `Order.tweaks` overlays
 * a buyer's customizations on top.
 */
export type ColorVariant = {
  id: string;
  name: string;
  swatch: string;
};

export type SizeVariant = {
  id: string;
  name: string;
};

export type Offer = {
  id: number;
  qty: number;
  label: string;
  price: number;
  was: number;
  perUnit: number;
  badge: "rec" | "best" | "top" | null;
  badgeText: string;
};

export type ProductData = {
  collection: string;
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  price: number;
  was: number;
  currency: string;
  inStock: boolean;
  stockLeft: number;
  viewing: number;
  soldThisWeek: number;
  keyBenefits: string[];
  variants: {
    color: ColorVariant[];
    size: SizeVariant[];
  };
  offers: Offer[];
};

export type Benefit = { ico: string; t: string; d: string };
export type Step = { n: string; t: string; d: string };
export type Ingredient = { color: string; name: string; use: string; pct: string };
export type Review = {
  rating: number;
  title: string;
  body: string;
  name: string;
  age: number;
  occ: string;
  verified: boolean;
  photos: number;
};
export type SocialReview = {
  platform: string;
  author: string;
  handle: string;
  text: string;
};
export type PressLogo = { text: string; cls: "mono" | "serif" | "script" };
export type FaqItem = { q: string; a: string };
export type SpecRow = [string, string];
export type CrossSell = {
  t: string;
  stars: number;
  count: number;
  price: number;
  was: number | null;
  ico: string;
};
export type ComparisonRow = [string, string, string];

export type BrandData = {
  name: string;
  tagline: string;
  location: string;
  founderName: string;
  founderTitle: string;
  founderQuote: string;
  contact: { email: string; phone: string; address: string };
  social: { instagram?: number; tiktok?: number; x?: number };
};

export type LandingContent = {
  product: ProductData;
  benefits: Benefit[];
  steps: Step[];
  ingredients: Ingredient[];
  reviews: Review[];
  socialReviews: SocialReview[];
  press: PressLogo[];
  faq: FaqItem[];
  specs: SpecRow[];
  crossSells: CrossSell[];
  comparison: ComparisonRow[];
  announce: string[];
  brand: BrandData;
};

/**
 * Visual tokens applied as CSS variables on the renderer's wrapper element.
 * A preset's palette + type pair lives here; a buyer's tweaks overlay it.
 */
export type LandingTokens = {
  accent: string;
  accentDeep: string;
  accentSoft: string;
  ink: string;
  ink2: string;
  muted: string;
  line: string;
  surface: string;
  /** Slightly different tint of `surface` — used for hover states + small chips. */
  surface2: string;
  /** Background of cards, sticky bars, FAQ items, review cards. White on light themes; a 1-step-lighter-than-bg slate on dark themes. */
  card: string;
  bg: string;
  /** CSS font-family value for display headlines */
  fontDisplay: string;
  /** CSS font-family value for body */
  fontBody: string;
  /** CSS font-family value for mono labels */
  fontMono: string;
};

export type LandingTweaks = Partial<LandingTokens> & {
  ctaCopy?: string;
};

export type LandingRendererProps = {
  content: LandingContent;
  tokens: LandingTokens;
  tweaks?: LandingTweaks;
};
