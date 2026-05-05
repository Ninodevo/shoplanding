import "dotenv/config";
import { config } from "dotenv";
import { getPrisma } from "../src/lib/db";

config({ path: ".env.local" });

/**
 * Hand-curated map of the components rendered by `handoff/project/template/Landing Template.html`
 * to the playbook Block slugs they help fulfill. Order matches the App() render order.
 */
const RENDERED: Array<{
  slug: string;
  name: string;
  componentName: string;
  placement: string;
  description: string;
  satisfies: string[];
}> = [
  {
    slug: "announcement-bar",
    name: "Announcement Bar",
    componentName: "AnnouncementBar",
    placement: "persistent-top",
    description:
      "Slim banner above the nav for free-shipping threshold, time-limited offers, or store-wide trust messages.",
    satisfies: ["general", "conversion-and-aov-boosters"],
  },
  {
    slug: "free-ship-bar",
    name: "Free-Shipping Progress Bar",
    componentName: "FreeShipBar",
    placement: "persistent-top",
    description:
      "Progress bar that updates as the cart grows toward the free-shipping threshold. Drives AOV.",
    satisfies: ["cta-area", "conversion-and-aov-boosters"],
  },
  {
    slug: "nav",
    name: "Navigation",
    componentName: "Nav",
    placement: "persistent-top",
    description:
      "Logo + section anchors + cart count. On a single-product landing page, navigation is intentionally minimal — no outgoing category links.",
    satisfies: ["general"],
  },
  {
    slug: "sticky-product-bar",
    name: "Sticky Product Bar",
    componentName: "StickyProductBar",
    placement: "sticky-on-scroll",
    description:
      "Top-anchored bar with product thumbnail, title, price, and CTA. Appears after the hero scrolls out and disappears at the footer.",
    satisfies: ["general", "cta-area"],
  },
  {
    slug: "gallery",
    name: "Product Gallery",
    componentName: "Gallery",
    placement: "in-flow",
    description:
      "Left side of the hero. Main image plus thumbnails, swipe on mobile, zoom, optional video tile, variant-aware swap.",
    satisfies: ["image-gallery"],
  },
  {
    slug: "product-info",
    name: "Product Info & Buy Box",
    componentName: "ProductInfo",
    placement: "in-flow",
    description:
      "Right side of the hero. Title, rating jump-link, key benefits, price (incl. strike-through), variant pickers, qty, subscription toggle, ATC, shipping/return signals, express-pay row.",
    satisfies: [
      "product-overview-above-the-cta-area",
      "cta-area",
      "conversion-and-aov-boosters",
    ],
  },
  {
    slug: "press",
    name: "Press / As-Seen-In",
    componentName: "Press",
    placement: "in-flow",
    description:
      "Greyscale logo strip of publications, retailers, or notable customers that have featured the product or brand.",
    satisfies: ["social-proof"],
  },
  {
    slug: "benefits",
    name: "Benefits Section",
    componentName: "BenefitsSection",
    placement: "in-flow",
    description:
      "Icon-and-headline grid translating features into customer benefits. Section titles must lead with benefits, not specs.",
    satisfies: ["product-description"],
  },
  {
    slug: "how-it-works",
    name: "How It Works",
    componentName: "HowItWorks",
    placement: "in-flow",
    description:
      "Three-step explainer (open / apply / enjoy, etc.) with a visual per step. Lowers friction for unfamiliar product categories.",
    satisfies: ["product-description"],
  },
  {
    slug: "comparison",
    name: "Comparison Table",
    componentName: "Comparison",
    placement: "in-flow",
    description:
      "Side-by-side checkmark table vs. typical alternatives. Frames the product against the buyer's mental competitor set.",
    satisfies: ["product-description"],
  },
  {
    slug: "ingredients",
    name: "Ingredients / What's Inside",
    componentName: "Ingredients",
    placement: "in-flow",
    description:
      "Visual list of contents with a one-line role for each. Use 'What's in the box' for non-CPG.",
    satisfies: ["product-description"],
  },
  {
    slug: "reviews",
    name: "Reviews",
    componentName: "ReviewsSection",
    placement: "in-flow",
    description:
      "Star-filterable reviews with reviewer photo, name, verified badge, occupation, photo of the product, and a review title.",
    satisfies: ["social-proof"],
  },
  {
    slug: "ugc",
    name: "UGC Wall",
    componentName: "UGC",
    placement: "in-flow",
    description:
      "Grid of real customer photos / Instagram tiles. Faces of happy customers using the product, ideally with handle attribution.",
    satisfies: ["social-proof"],
  },
  {
    slug: "cross-sell",
    name: "Cross-Sell",
    componentName: "CrossSell",
    placement: "in-flow",
    description:
      "'Customers also viewed / often bought together'. AOV booster placed below the heaviest social-proof to ride momentum.",
    satisfies: ["conversion-and-aov-boosters"],
  },
  {
    slug: "founder",
    name: "Founder / Origin Story",
    componentName: "FounderSection",
    placement: "in-flow",
    description:
      "Photo + short letter from the founder. Adds trust and explains the 'why now' behind the product.",
    satisfies: ["social-proof"],
  },
  {
    slug: "specs",
    name: "Specs Table",
    componentName: "Specs",
    placement: "in-flow",
    description:
      "Technical spec table — readable rows, hover state, grouped by topic. Often collapsed in an accordion on mobile.",
    satisfies: ["product-description"],
  },
  {
    slug: "faq",
    name: "FAQ",
    componentName: "FAQSection",
    placement: "in-flow",
    description:
      "Product-specific and store-wide FAQs in an accordion. Pre-empts the doubts that block checkout.",
    satisfies: ["product-description"],
  },
  {
    slug: "final-cta",
    name: "Final CTA",
    componentName: "FinalCTA",
    placement: "in-flow",
    description:
      "Full-bleed closing CTA section. Repeats the offer and primary button for users who scrolled all the way without buying.",
    satisfies: ["cta-area"],
  },
  {
    slug: "footer",
    name: "Footer",
    componentName: "Footer",
    placement: "in-flow",
    description:
      "Trust marks, contact, legal, social links. On a landing page the footer is intentionally compact — no category dump.",
    satisfies: ["general"],
  },
  {
    slug: "sticky-atc-bar",
    name: "Sticky ATC Bar",
    componentName: "StickyAtcBar",
    placement: "persistent-bottom",
    description:
      "Mobile-first bottom-anchored ATC. Reappears whenever the hero CTA is off-screen so the buy action is always one tap away.",
    satisfies: ["cta-area", "general"],
  },
];

async function main() {
  const prisma = getPrisma();

  const playbookSlugs = new Set(
    (await prisma.block.findMany({ select: { slug: true } })).map(
      (b) => b.slug,
    ),
  );
  for (const r of RENDERED) {
    for (const s of r.satisfies) {
      if (!playbookSlugs.has(s)) {
        throw new Error(
          `RenderedBlock '${r.slug}' references unknown playbook block '${s}'. Run seed:blocks first.`,
        );
      }
    }
  }

  for (let i = 0; i < RENDERED.length; i++) {
    const r = RENDERED[i];
    const data = {
      slug: r.slug,
      name: r.name,
      componentName: r.componentName,
      position: i,
      placement: r.placement,
      description: r.description,
      satisfies: r.satisfies,
    } as const;
    await prisma.renderedBlock.upsert({
      where: { slug: r.slug },
      update: data,
      create: data,
    });
  }
  const total = await prisma.renderedBlock.count();
  console.log(`Seeded ${RENDERED.length} rendered blocks. Total in DB: ${total}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
