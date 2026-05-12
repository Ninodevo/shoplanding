<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ShopLanding

We sell **the system** for an optimized single-product landing page (block anatomy + CRO rules from `handoff/project/uploads/checklist.xlsx`, 🛬 Landing page sheet), packaged as Shopify and WooCommerce theme zips plus a portable system spec.

## Surfaces

- `/playbook` — block library, marketing/SEO surface.
- `/showcase` — pre-generated demos rendered from the same `<LandingRenderer>` we ship. Seed content is hand-written and stored in DB; **do not pull in `@ai-sdk/openai` for showcase copy**.
- `/themes/[slug]` — sales page; live demo + screenshots + checklist coverage.
- `/preview/[slug]` — buyer's personalized live preview (post-purchase tweaks).
- `/account/downloads` — license + signed download URLs.

## Stack

Next 16 (App Router) + React 19 + Tailwind v4 + Prisma 7 with `@prisma/adapter-pg` against Neon + Stripe. Mirror `~/work/private/rule1-advisor` conventions where it makes sense.

## Reference material

- `handoff/project/template/Landing Template.html` — canonical block anatomy. Source of truth for the renderer.
- `handoff/project/Orelle Daystick.html` — concrete branded example using the same anatomy.
- `handoff/project/tweaks-panel.jsx` — the runtime tweak primitive that becomes the buyer's intake form.
- `handoff/project/uploads/checklist.xlsx`, sheet 🛬 — 69 CRO items each `Block.checklistRefs` points back to.

## Pricing (model A)

Per-theme single-store $99 / unlimited-stores $249 / optional setup add-on $199. No subscription tier.
