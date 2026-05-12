# Product

## What we sell

Three layers, one product:

1. **The Playbook** — 7 CRO blocks with 69 documented conversion rules. The *what* and *why* of an optimized single-product page. Lives at `/playbook`. Free; SEO + marketing surface.
2. **The Rendered Components** — 20 React-shaped blocks (Hero / Gallery / ProductInfo / Sticky ATC / Press / Benefits / How-It-Works / Comparison / Ingredients / Reviews / UGC / Cross-Sell / Founder / Specs / FAQ / Final CTA / Footer / Announcement Bar / Free-Ship Bar / Sticky Product Bar). The *how it shows up on screen*. Each component links to the playbook blocks whose CRO rules it satisfies.
3. **The Themes** — for each niche-tuned `LayoutPreset`, we ship a Shopify `.zip` and a WooCommerce `.zip` that render every component, plus an exportable system spec (JSON + Markdown) for teams who want to reimplement themselves.

## What we are *not* selling

- A page builder. The order of blocks is opinionated and fixed; only content + tokens vary.
- A multi-product storefront. There is no homepage, category page, search, or wishlist. One product, one page, one decision.
- A subscription. One-time license, lifetime updates per license tier.

## Who buys this

- **Solo founders** launching one product (supplements, skincare, food/CPG, single-SKU gadgets, candles, etc.).
- **DTC operators** spinning up a side product or a campaign-specific landing page who don't want to wire a full storefront.
- **Agencies / freelancers** who need a defensible CRO baseline they can ship in a day.

These are not buyers shopping on price. They want a *defensibly good* baseline so they can spend their attention on the product, not on debating section order.

## The wedge

Every theme on Themeforest / Shopify Theme Store positions on visuals. ShopLanding positions on **conversion logic**: every block on the page exists for a reason that's documented and traceable to a rule. The marketing site (`/playbook`) *is* the proof. A buyer reads it and immediately understands the people behind it have run real stores.

## Niches at launch

Four `LayoutPreset`s, each tuned for one niche:

1. **Skincare / cosmetics** (anatomy in `handoff/project/Orelle Daystick.html`; live preset is Orelle · Daystick, seeded from `scripts/seed-presets.ts`)
2. **Food / CPG**
3. **Gadget / single-SKU electronics**
4. **Supplement**

Each preset varies palette, type, demo seed content, and section emphasis — but renders from the same `<LandingRenderer>`.

## Personalization at purchase

Buyers don't fork code. They fill the tweaks panel at checkout — brand name, hero image, primary palette, three benefit bullets, font pair — and the delivered zips ship pre-baked with that content. The same configuration powers a hosted live preview at `/preview/[orderId]` they can share before they unpack the zip.

The tweaks panel primitive exists already in `handoff/project/tweaks-panel.jsx`; we promote it from "design-time toy" to "buyer intake form."
