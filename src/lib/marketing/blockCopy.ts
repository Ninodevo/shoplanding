/**
 * Public-facing one-liners per playbook block. The DB `Block.purpose` field
 * is internal seed metadata ("4 CRO requirements from the 🛬 Landing page
 * checklist") and must never render on marketing surfaces — use these
 * instead wherever a block needs a short description.
 */
export const BLOCK_ONE_LINER: Record<string, string> = {
  general:
    "The page's skeleton: direct paths to checkout, no attention leaks, a sticky buy bar, and a way to ask questions.",
  "product-overview-above-the-cta-area":
    "The first screen: a descriptive title, benefit-led subtitle, rating linked to reviews, and a scannable benefit list.",
  "image-gallery":
    "Photography that does the product handling: multiple photos, video, zoom, thumbnails, and mobile swipe.",
  "cta-area":
    "The buy box: CTA prominence, price and savings, shipping and returns in sight, express payments and BNPL.",
  "social-proof":
    "Trust transfer: press logos and reviews with names, photos, occupations, and verified badges.",
  "conversion-and-aov-boosters":
    "Bigger carts: quantity discounts, bundles, cross-sells, and urgency that's actually true.",
  "product-description":
    "Scannable depth: benefit-led headings, FAQ, comparison table, specs, and a three-step how-to.",
};
