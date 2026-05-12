import "dotenv/config";
import { config } from "dotenv";
import { getPrisma } from "../src/lib/db";
import {
  DEFAULT_CONTENT,
  DEFAULT_TOKENS,
} from "../src/components/landing/defaultContent";
import type {
  LandingContent,
  LandingTokens,
} from "../src/components/landing/types";

config({ path: ".env.local" });

/**
 * Three niche `LayoutPreset` rows seeded for /showcase.
 *
 * Each preset = a (tokens, demoSeed) pair. When the buyer picks a niche on the
 * theme card, we render `<LandingRenderer tokens={preset.tokens} content={preset.demoSeed} />`
 * and that's the live demo at /showcase/[slug].
 *
 * Slugs match the `THEME_CATALOG` entries in `src/lib/marketing/copy.ts` so the
 * marketing card → showcase page link can be a 1:1 lookup once we wire it.
 */

type PresetSeed = {
  slug: string;
  name: string;
  niche: string;
  tokens: LandingTokens;
  content: LandingContent;
};

// ============================================================================
// Skincare — Orelle · Daystick (placeholder brand for the demo)
// ============================================================================
const SKINCARE: PresetSeed = {
  slug: "skincare",
  name: "Orelle",
  niche: "Skincare",
  tokens: {
    ...DEFAULT_TOKENS,
    accent: "#1f5a40",
    accentDeep: "#0f3a26",
    accentSoft: "#e6f0ea",
    surface: "#f5e6d6",
    surface2: "#ebdcc7",
    card: "#ffffff",
    bg: "#faf7f1",
    fontDisplay: '"Fraunces", Georgia, serif',
  },
  content: {
    ...DEFAULT_CONTENT,
    product: {
      ...DEFAULT_CONTENT.product,
      collection: "Daily Essentials",
      title: "Daystick — solid lotion you can actually carry",
      subtitle:
        "The pocketable solid lotion stick that keeps skin happy on planes, hikes, and Tuesdays — small-batch from a clean-formulation studio in California.",
      rating: 4.8,
      reviewCount: 487,
      price: 39,
      was: 49,
      stockLeft: 23,
      viewing: 47,
      soldThisWeek: 312,
      keyBenefits: [
        "Solid format — pocketable, no spills, TSA-friendly",
        "Hero ingredient: organic shea — clinically tested for 14-day softer skin",
        "Plant-based, refillable, 1% donated to clean-water nonprofits",
        "Backed by our 30-day money-back guarantee",
      ],
      variants: {
        color: [
          { id: "natural", name: "Unscented", swatch: "#d4cdbe" },
          { id: "rose", name: "Rose & Geranium", swatch: "#e8b8b0" },
          { id: "sage", name: "Sage & Bergamot", swatch: "#a8c4a0" },
          { id: "midnight", name: "Vanilla & Oud", swatch: "#2a2a3a" },
        ],
        size: [
          { id: "sm", name: "0.5 oz" },
          { id: "md", name: "1.7 oz" },
          { id: "lg", name: "3.4 oz" },
        ],
      },
      offers: [
        { id: 1, qty: 1, label: "1× Stick", price: 39, was: 49, perUnit: 39, badge: null, badgeText: "" },
        { id: 2, qty: 2, label: "2× Pack", price: 70, was: 98, perUnit: 35, badge: "rec", badgeText: "Recommended" },
        { id: 3, qty: 3, label: "3× Bundle", price: 99, was: 147, perUnit: 33, badge: "best", badgeText: "Best Value" },
      ],
    },
    brand: {
      name: "orelle.",
      tagline: "Small-batch skincare in California. For people who keep their routine in a backpack.",
      location: "San Francisco, CA",
      founderName: "Lena Hartmann",
      founderTitle: "Founder & Formulator · Ex-cosmetic chemist",
      founderQuote:
        "I built Daystick because every lotion I owned lived on a bathroom shelf I was rarely standing next to. Three years, fourteen formulations, and a lot of feedback later — here it is.",
      contact: {
        email: "hello@orelle.com",
        phone: "+1 (800) 555-0142",
        address: "1234 Mission St, San Francisco, CA",
      },
      social: { instagram: 48200, tiktok: 112000, x: 9400 },
    },
  },
};

// ============================================================================
// Supplement — VitalStack · Daily Greens Stick
// ============================================================================
const SUPPLEMENT: PresetSeed = {
  slug: "supplement",
  name: "VitalStack",
  niche: "Supplement",
  tokens: {
    // Light theme with a punchy emerald accent — clinical / wellness vibe.
    // We tried a dark variant but the handoff CSS has too many spots that
    // assume light surfaces; switching to light eliminates the contrast
    // landmines and keeps the brand differentiation via the deep green CTAs.
    ...DEFAULT_TOKENS,
    accent: "#00a85f",
    accentDeep: "#005c34",
    accentSoft: "#dcf3e7",
    bg: "#f6faf7",
    surface: "#e8f0eb",
    surface2: "#dce6df",
    card: "#ffffff",
    ink: "#0a1810",
    ink2: "#2d3a32",
    muted: "#5d6c63",
    line: "#cdd9d1",
    fontDisplay: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  content: {
    ...DEFAULT_CONTENT,
    product: {
      ...DEFAULT_CONTENT.product,
      collection: "Daily Stack · 30 servings",
      title: "Daily Greens Stick — 47 nutrients in one shake",
      subtitle:
        "The clinically-formulated greens stick that replaces your multivitamin, your spirulina jar, and your guilt — from VitalStack.",
      rating: 4.7,
      reviewCount: 12_408,
      price: 60,
      was: 75,
      stockLeft: 184,
      viewing: 209,
      soldThisWeek: 4_022,
      keyBenefits: [
        "47 vitamins, minerals, adaptogens, probiotics — third-party tested",
        "30 single-serve sticks — no scoop, no clumps, mixes in cold water",
        "Subscribe & save 20% — skip, swap, cancel anytime",
        "Backed by our 60-day no-questions-asked refund policy",
      ],
      variants: {
        color: [
          { id: "berry", name: "Wild Berry", swatch: "#c2185b" },
          { id: "citrus", name: "Citrus Mint", swatch: "#cddc39" },
          { id: "matcha", name: "Matcha", swatch: "#558b2f" },
          { id: "neutral", name: "Unflavored", swatch: "#bdbdbd" },
        ],
        size: [
          { id: "sm", name: "30 days" },
          { id: "md", name: "60 days" },
          { id: "lg", name: "90 days" },
        ],
      },
      offers: [
        { id: 1, qty: 1, label: "1× 30-day stack", price: 60, was: 75, perUnit: 60, badge: null, badgeText: "" },
        { id: 2, qty: 2, label: "Subscribe (30-day refill)", price: 48, was: 60, perUnit: 48, badge: "rec", badgeText: "Save 20%" },
        { id: 3, qty: 3, label: "Family pack (3× 30-day)", price: 144, was: 180, perUnit: 48, badge: "best", badgeText: "Best Value" },
      ],
    },
    benefits: [
      { ico: "✦", t: "Third-party tested", d: "Every batch independently tested for heavy metals, pesticides, and label accuracy." },
      { ico: "◐", t: "Clinically-dosed", d: "Active ingredients hit the clinical-trial dose, not the trace amounts of cheaper brands." },
      { ico: "◇", t: "No proprietary blends", d: "We list every milligram of every ingredient. No 'proprietary blend' hand-waving." },
      { ico: "✓", t: "60-day guarantee", d: "Try it for two months. Don't feel a difference? Full refund, keep the box." },
    ],
    steps: [
      { n: "01", t: "Tear & pour", d: "Drop one stick into 8–12 oz of cold water." },
      { n: "02", t: "Shake or stir", d: "Dissolves in 5 seconds. No scoop, no blender, no chunks." },
      { n: "03", t: "Drink any time", d: "Most customers take theirs with breakfast. Caffeine-free — fine before bed too." },
    ],
    ingredients: [
      { color: "#558b2f", name: "Spirulina + Chlorella", use: "Greens base · 4,000 mg", pct: "32%" },
      { color: "#cddc39", name: "Vitamin & mineral complex", use: "47 nutrients at clinical doses", pct: "24%" },
      { color: "#7e57c2", name: "Adaptogen blend", use: "Ashwagandha · Rhodiola · Reishi", pct: "16%" },
      { color: "#26a69a", name: "Probiotic strains", use: "5 billion CFU · 4 strains", pct: "12%" },
      { color: "#ff7043", name: "Digestive enzymes", use: "Bromelain · Papain · Lipase", pct: "8%" },
      { color: "#90a4ae", name: "Natural flavor", use: "Real berries, no sucralose", pct: "6%" },
      { color: "#bdbdbd", name: "Stevia + monk fruit", use: "Zero sugar, zero glycemic load", pct: "2%" },
    ],
    reviews: [
      { rating: 5, title: "Energy without the crash", body: "Two weeks in and my afternoon energy is genuinely different. No 3pm crash, no jitter. I was skeptical of 'greens powder' but this one earned it.", name: "Marcus Levy", age: 39, occ: "Founder", verified: true, photos: 1 },
      { rating: 5, title: "Replaced four supplements", body: "I was taking a multivitamin, a probiotic, ashwagandha, and a greens powder. This replaced all four for less than what I was paying.", name: "Anjali Rao", age: 34, occ: "Physician Assistant", verified: true, photos: 0 },
      { rating: 4, title: "Berry flavor is great, citrus less so", body: "Berry is the move. Citrus tasted a little metallic to me. Repurchasing the berry 90-day pack.", name: "Devon Park", age: 28, occ: "Designer", verified: true, photos: 0 },
      { rating: 5, title: "Worth the price", body: "Yes it's not cheap. But add up what you're paying for the four things this replaces and it's actually a deal. My energy is up, sleep is better, gut is happier.", name: "Lina Gómez", age: 42, occ: "Teacher", verified: true, photos: 2 },
    ],
    press: [
      { text: "WIRED", cls: "mono" },
      { text: "Men's Health", cls: "serif" },
      { text: "Outside", cls: "mono" },
      { text: "GQ", cls: "mono" },
      { text: "Self", cls: "serif" },
      { text: "Tim Ferriss", cls: "script" },
    ],
    faq: [
      { q: "How quickly will I feel a difference?", a: "Most customers report visible energy improvement within 7–10 days of consistent daily use. Gut and sleep changes take a bit longer — usually 3–4 weeks." },
      { q: "When should I take it?", a: "First thing in the morning works best, but any time of day is fine — it's caffeine-free." },
      { q: "Is it third-party tested?", a: "Every batch is independently tested for heavy metals, microbials, and label accuracy. Test results are public on our site, batch-by-batch." },
      { q: "Can I take it pregnant / breastfeeding?", a: "Please ask your doctor. We don't add anything contraindicated, but the formula is potent and we want you to be sure." },
      { q: "How does Subscribe & Save work?", a: "Pick a frequency (every 30, 60, or 90 days), save 20% on every order, free shipping included, skip or cancel in one click." },
      { q: "Do you ship internationally?", a: "Yes — 38 countries. US orders arrive in 2–4 business days, international 7–14." },
      { q: "What if I don't love it?", a: "60-day refund, no questions, keep the box. Email support@vitalstack.io." },
    ],
    specs: [
      ["Net weight per stick", "12 g"],
      ["Servings per box", "30 single-serve sticks"],
      ["Serving size", "1 stick (12 g) in 8–12 oz water"],
      ["Calories per serving", "35 kcal"],
      ["Sugar per serving", "0 g"],
      ["Caffeine per serving", "0 mg"],
      ["Allergens", "Manufactured in a facility that processes tree nuts and soy"],
      ["Country of origin", "Made in California, USA · GMP-certified facility"],
    ],
    crossSells: [
      { t: "Sleep Stack — magnesium + L-theanine", stars: 4.8, count: 4_122, price: 32, was: 40, ico: "◑" },
      { t: "Travel pouch (holds 14 sticks)", stars: 4.9, count: 808, price: 18, was: null, ico: "◇" },
      { t: "Stainless steel shaker bottle", stars: 4.7, count: 612, price: 24, was: 32, ico: "✦" },
    ],
    comparison: [
      ["Active ingredients", "47 at clinical dose", "8 at trace dose"],
      ["Proprietary blends", "Never — every mg listed", "Always"],
      ["Sugar per serving", "0 g (stevia + monk fruit)", "8–12 g (added sugar)"],
      ["Third-party tested", "Every batch, results public", "Rarely"],
      ["Subscription discount", "20% off + free shipping", "5–10% off"],
      ["Refund window", "60 days, keep the box", "14 days, restocking fee"],
    ],
    announce: [
      "Subscribe & save 20% always",
      "Free shipping on US orders",
      "60-day refund guarantee",
      "Now shipping to 38 countries",
      "Third-party tested every batch",
    ],
    brand: {
      name: "vitalstack.",
      tagline: "Clinical-dose nutrition without the proprietary-blend nonsense.",
      location: "Los Angeles, CA",
      founderName: "Dr. Devon Park",
      founderTitle: "Founder · former clinical pharmacist",
      founderQuote:
        "After ten years prescribing, I got tired of supplement labels lying. VitalStack lists every milligram of every ingredient — because that's the bar.",
      contact: {
        email: "support@vitalstack.io",
        phone: "+1 (800) 555-0220",
        address: "5500 Wilshire Blvd, Los Angeles, CA",
      },
      social: { instagram: 312_000, tiktok: 488_000, x: 41_000 },
    },
  },
};

// ============================================================================
// Gadget — Aurabud · Single-SKU earbud
// ============================================================================
const GADGET: PresetSeed = {
  slug: "gadget",
  name: "Aurabud",
  niche: "Gadget",
  tokens: {
    ...DEFAULT_TOKENS,
    accent: "#0066ff",
    accentDeep: "#0044cc",
    accentSoft: "#e6efff",
    bg: "#ffffff",
    surface: "#f4f4f6",
    surface2: "#ececef",
    card: "#ffffff",
    ink: "#0a0a0a",
    ink2: "#3a3a40",
    line: "#e5e5e8",
    fontDisplay: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  content: {
    ...DEFAULT_CONTENT,
    product: {
      ...DEFAULT_CONTENT.product,
      collection: "Aurabud Gen 2 · 2026",
      title: "Aurabud Gen 2 — the earbud you'll forget you're wearing",
      subtitle:
        "Active noise cancellation, 38-hour battery, IPX4 sweat-proof — engineered in San Francisco, $129 instead of $279.",
      rating: 4.6,
      reviewCount: 2_137,
      price: 129,
      was: 179,
      stockLeft: 38,
      viewing: 71,
      soldThisWeek: 824,
      keyBenefits: [
        "Active noise cancellation rated −32 dB — quieter than the AirPods Pro 2",
        "38-hour total battery (8h bud + 30h case) — beats every comp at this price",
        "Multi-point Bluetooth 5.4 — laptop + phone simultaneously",
        "30-day return, 2-year warranty, free firmware updates forever",
      ],
      variants: {
        color: [
          { id: "graphite", name: "Graphite", swatch: "#2a2a2a" },
          { id: "ivory", name: "Ivory", swatch: "#f0ece4" },
          { id: "azure", name: "Azure Blue", swatch: "#0066ff" },
        ],
        size: [
          { id: "sm", name: "S tip" },
          { id: "md", name: "M tip" },
          { id: "lg", name: "L tip" },
        ],
      },
      offers: [
        { id: 1, qty: 1, label: "1× Aurabud", price: 129, was: 179, perUnit: 129, badge: null, badgeText: "" },
        { id: 2, qty: 2, label: "2× His & hers", price: 240, was: 358, perUnit: 120, badge: "rec", badgeText: "Save $118" },
        { id: 3, qty: 3, label: "3× Family pack", price: 339, was: 537, perUnit: 113, badge: "best", badgeText: "Best Value" },
      ],
    },
    benefits: [
      { ico: "◯", t: "−32 dB ANC", d: "Industry-leading active noise cancellation. Plane mode silences engines completely." },
      { ico: "◑", t: "38-hour battery", d: "8 hours per bud + 30 in the case. Every weekday on one charge, every flight covered." },
      { ico: "◇", t: "Multi-point pairing", d: "Connect to laptop and phone simultaneously. Calls auto-route to whichever is ringing." },
      { ico: "✓", t: "2-year warranty", d: "Free replacement if a bud fails. Free firmware updates for the life of the product." },
    ],
    steps: [
      { n: "01", t: "Open the case", d: "Pop the lid; the buds enter pairing mode automatically." },
      { n: "02", t: "Connect once", d: "Pair to your laptop and phone simultaneously via the Aurabud app." },
      { n: "03", t: "Forget you're wearing them", d: "5.2 g per bud. The lightest in the category — most owners wear them all day." },
    ],
    ingredients: [
      { color: "#2a2a2a", name: "Graphene driver", use: "11 mm diaphragm — wider frequency response than competitors", pct: "—" },
      { color: "#0066ff", name: "Qualcomm QCC5181 chip", use: "aptX Lossless · Bluetooth 5.4 · multi-point", pct: "—" },
      { color: "#999999", name: "Beam-forming mics × 6", use: "Three per bud — call quality benchmarked vs. AirPods Pro 2", pct: "—" },
      { color: "#7e57c2", name: "Active noise cancellation", use: "−32 dB attenuation · 4 modes (off · transparency · light ANC · deep ANC)", pct: "—" },
      { color: "#26a69a", name: "Wireless charging case", use: "Qi-compatible · USB-C · 30-hour reserve", pct: "—" },
      { color: "#ff7043", name: "IPX4 splash protection", use: "Sweat- and rain-resistant · gym-tested 6 months", pct: "—" },
    ],
    reviews: [
      { rating: 5, title: "Better than AirPods Pro at half the price", body: "I returned my AirPods Pro 2 after a week with these. ANC is genuinely deeper, fit is more comfortable, battery is double. Multi-point is the killer feature.", name: "Naomi Tan", age: 31, occ: "Software Engineer", verified: true, photos: 1 },
      { rating: 5, title: "Daily-driver buds", body: "I wear these 8 hours a day. Two months in, no complaints. Transparency mode is excellent for calls in coffee shops.", name: "Alex Brennan", age: 37, occ: "Architect", verified: true, photos: 0 },
      { rating: 4, title: "Touch controls are finicky", body: "Sound is great, fit is great, ANC is great. The capacitive touch buttons are a little too sensitive — I keep accidentally pausing music. Otherwise excellent.", name: "Priya Shah", age: 26, occ: "Product Manager", verified: true, photos: 0 },
      { rating: 5, title: "Flight-tested", body: "Took these on a 14-hour flight. Engine noise was completely gone. Battery still had 30% on the bud and full charge in the case when I landed. Sold.", name: "Marcus Cole", age: 44, occ: "Consultant", verified: true, photos: 2 },
    ],
    press: [
      { text: "The Verge", cls: "mono" },
      { text: "Wirecutter", cls: "serif" },
      { text: "Engadget", cls: "mono" },
      { text: "MKBHD", cls: "script" },
      { text: "Gizmodo", cls: "mono" },
      { text: "Ars Technica", cls: "serif" },
    ],
    faq: [
      { q: "How does battery life compare to AirPods Pro 2?", a: "Aurabud: 8 hours per bud + 30 in case (38h total). AirPods Pro 2: 6 hours per bud + 24 in case (30h total). Real-world tested at moderate volume with ANC on." },
      { q: "Will they work with my Android phone / Windows laptop?", a: "Yes — Bluetooth 5.4 multi-point pairs with anything. The Aurabud app is on iOS, Android, macOS, and Windows for firmware updates and EQ presets." },
      { q: "Can I wear them at the gym?", a: "Yes. IPX4 means splash- and sweat-resistant. We tested the same pair through 6 months of gym use without issues." },
      { q: "What if a bud breaks?", a: "Free replacement under 2-year warranty for any non-impact failure. Lost a bud? Replacement is $39." },
      { q: "Do they support hi-res audio?", a: "Yes — aptX Lossless via the QCC5181 chip when paired with a compatible source. iPhone is AAC-only (Apple's limitation, not ours)." },
      { q: "Return policy?", a: "30 days, no questions, free return shipping in the US." },
    ],
    specs: [
      ["Driver", "11 mm graphene diaphragm"],
      ["Chip", "Qualcomm QCC5181 · Bluetooth 5.4"],
      ["ANC", "−32 dB · 4 modes (off / transparency / light / deep)"],
      ["Battery (bud)", "8 hours ANC on · 11 hours ANC off"],
      ["Battery (case)", "30 hours · USB-C + Qi wireless"],
      ["Codecs", "aptX Lossless · aptX Adaptive · AAC · SBC"],
      ["Weight", "5.2 g per bud · 42 g case"],
      ["Water resistance", "IPX4 (sweat + splash)"],
      ["Warranty", "2 years · free firmware updates for life"],
    ],
    crossSells: [
      { t: "Aurabud charging stand (Qi)", stars: 4.7, count: 312, price: 39, was: 49, ico: "◐" },
      { t: "Replacement ear tips (S/M/L · 6 pairs)", stars: 4.9, count: 188, price: 14, was: null, ico: "◇" },
      { t: "Travel case (zip · padded)", stars: 4.8, count: 96, price: 24, was: 32, ico: "✦" },
    ],
    comparison: [
      ["Active noise cancellation", "−32 dB", "−24 dB"],
      ["Battery (bud + case)", "38 hours", "30 hours"],
      ["Multi-point Bluetooth", "Yes — laptop + phone", "Phone only"],
      ["Hi-res audio", "aptX Lossless", "AAC only"],
      ["Price", "$129", "$249"],
      ["Warranty", "2 years", "1 year"],
    ],
    announce: [
      "Free 2-day shipping in US",
      "30-day return, 2-year warranty",
      "Engineered in San Francisco",
      "Multi-point Bluetooth 5.4",
    ],
    brand: {
      name: "aurabud.",
      tagline: "Audio gear that punches above its price tag. Engineered, not marketed.",
      location: "San Francisco, CA",
      founderName: "Lin Hartwell",
      founderTitle: "Founder · ex-Sonos audio engineer",
      founderQuote:
        "I spent eight years at Sonos watching the same DSP tricks ship at $300 prices. Aurabud is what happens when you cut the marketing budget and put it into the driver.",
      contact: {
        email: "support@aurabud.co",
        phone: "+1 (800) 555-0301",
        address: "188 Townsend St, San Francisco, CA",
      },
      social: { instagram: 22_400, tiktok: 9_800, x: 14_200 },
    },
  },
};

const PRESETS: PresetSeed[] = [SKINCARE, SUPPLEMENT, GADGET];

async function main() {
  const prisma = getPrisma();

  const blocks = await prisma.block.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true },
  });
  if (blocks.length === 0) {
    throw new Error(
      "No `Block` rows found. Run `npm run seed:blocks` before this script.",
    );
  }
  console.log(`Found ${blocks.length} playbook blocks. Seeding ${PRESETS.length} presets…`);

  for (const seed of PRESETS) {
    const data = {
      slug: seed.slug,
      name: seed.name,
      niche: seed.niche,
      tokens: seed.tokens as unknown as object,
      demoSeed: seed.content as unknown as object,
    };
    const preset = await prisma.layoutPreset.upsert({
      where: { slug: seed.slug },
      update: data,
      create: data,
    });

    // PresetBlock rows: replace wholesale on every run so order/content stays in sync.
    await prisma.presetBlock.deleteMany({ where: { presetId: preset.id } });
    await prisma.presetBlock.createMany({
      data: blocks.map((b, i) => ({
        presetId: preset.id,
        blockId: b.id,
        position: i,
      })),
    });
    console.log(
      `  · ${seed.niche.padEnd(11)} → ${seed.slug.padEnd(11)} · ${blocks.length} preset_blocks`,
    );
  }

  const total = await prisma.layoutPreset.count();
  const totalBlocks = await prisma.presetBlock.count();
  console.log(
    `Seeded ${PRESETS.length} presets. DB now has ${total} preset rows · ${totalBlocks} preset_block rows.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
