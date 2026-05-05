# Roadmap

Ordered. Each phase ends with something a buyer (or you) can see and click.

## ✅ Phase 0 — Scaffold (done)

- [x] Next 16 + React 19 + Tailwind v4 + ESLint scaffold under `src/`.
- [x] Prisma 7 wired with `@prisma/adapter-pg` against Neon. Dual `DATABASE_URL` / `PRISMA_MIGRATE_DATABASE_URL`.
- [x] `src/lib/db.ts` singleton + sslmode pin.
- [x] `package.json` scripts: `predev` runs `prisma generate`; `build` runs `prisma migrate deploy && next build`.
- [x] `AGENTS.md` + `CLAUDE.md` + `handoff/` preserved.

## ✅ Phase 1 — Block taxonomy (done)

- [x] Schema: `Block`, `LayoutPreset`, `PresetBlock`, `Theme`, `Order`. Migration `init` applied to Neon.
- [x] Schema: `RenderedBlock`. Migration `add_rendered_blocks` applied.
- [x] `seed:blocks` parses `handoff/project/uploads/checklist.xlsx` 🛬 sheet → 7 Block rows (69 rules).
- [x] `seed:rendered` hand-curated → 20 RenderedBlock rows with `satisfies` mapping back to playbook blocks.
- [x] `/playbook` server component renders both tables with placement legend.
- [x] `/` homepage replaced with editorial intro + live stats from DB.

## ✅ Phase 2 — The renderer (done)

- [x] `src/components/landing/types.ts` — `LandingContent`, `LandingTokens`, `LandingTweaks`, plus inner shapes (`ProductData`, `Offer`, `Review`, etc.).
- [x] `src/components/landing/defaultContent.ts` — verbatim port of the handoff fixture (`PRODUCT`, `BENEFITS`, `STEPS`, `INGREDIENTS`, `REVIEWS`, `SOCIAL_REVIEWS`, `PRESS`, `FAQ`, `SPECS`, `CROSS_SELLS`, `BRAND`).
- [x] `src/components/landing/landing.css` — handoff CSS copied verbatim, scoped via `:root` variables that the wrapper element overrides.
- [x] `src/components/landing/LandingRenderer.tsx` — single client component holding cart/qty/offer/sub/scroll state. All 20 `RenderedBlock` components inline as helpers in the same file. Tokens flow through CSS variables on the wrapper; tweaks override tokens.
- [x] `/dev/render-test` route segment with its own layout (loads Fraunces + Inter + JetBrains Mono from Google Fonts) and a page that mounts `<LandingRenderer>` with `DEFAULT_CONTENT` + `DEFAULT_TOKENS`. Returns 200 with all 20 blocks present in the HTML.

Deferred to a later pass:
- [ ] Schema.org Product JSON-LD + OG tags driven by `content` (will land alongside `/themes/[slug]` and `/preview/[slug]` in Phase 4–5, where SEO actually matters).
- [ ] Splitting static blocks (Specs, FAQ shell, Footer) back into server components if hydration cost becomes a problem. Single-client-component is fine for v1.

## ⏳ Phase 3 — Niche presets + showcase

- [ ] `seed:presets` script populating 4 `LayoutPreset` rows: skincare, food/CPG, gadget, supplement. Each with palette tokens, type pair, and hand-written `demoSeed` (brand name, product name, hero copy, 3 benefits, FAQ entries, etc.).
- [ ] `/showcase` lists the 4 presets as framed previews. Each card opens a full live demo at `/showcase/[slug]` rendered by `<LandingRenderer>`.
- [ ] Add a small "blocks visible" overlay toggle on showcase pages so buyers can see *which* of the 20 components are in view.

**Exit criterion:** A visitor can see four very different landing pages built from the same renderer, with the same CRO logic.

## ⏳ Phase 4 — Sales surface

- [ ] `Theme` rows seeded (one per preset for v1).
- [ ] `/themes/[slug]` sales page: live demo embed, screenshots, what's included, version + changelog, three-tier pricing card.
- [ ] Pricing card uses Stripe Checkout. Three line items per theme:
  - Single-store license — $99
  - Unlimited-stores license — $249
  - + Done-for-you setup — $199 (add-on)
- [ ] Stripe webhook → `Order.status = paid`, license key issued, `previewSlug` minted.

**Exit criterion:** Test-mode buyer can complete checkout and see an `Order` row appear with a license key.

## ⏳ Phase 5 — Tweaks-panel intake + preview

- [ ] Promote `handoff/project/tweaks-panel.jsx` to `src/components/TweaksPanel.tsx` (client island).
- [ ] Post-checkout: redirect to `/preview/[previewSlug]` showing `<LandingRenderer>` with the buyer's tweaks. Tweaks edit live, persisted to `Order.tweaks` via a server action.
- [ ] Expose a public read-only preview URL the buyer can share before they unpack the zip.

**Exit criterion:** Test-mode buyer can finish the tweaks form and share a live preview URL.

## ⏳ Phase 6 — Theme packagers

The packagers turn `(preset, tweaks)` into downloadable artifacts.

- [ ] Shopify packager: walks the rendered output and emits `.zip` of Liquid templates + JSON section configs + assets. Targets Shopify CLI 3 theme structure.
- [ ] WooCommerce packager: emits a child theme of a clean parent (Storefront or Blocksy), packaged as a `.zip` plugin/theme registering a "Single Product Landing" page template.
- [ ] System-spec exporter: emits portable JSON + Markdown describing block order, content, tokens — for teams reimplementing.
- [ ] Run packagers on order completion → upload to blob storage → store URLs on `Order`. Signed download URLs at `/account/downloads`.

**Exit criterion:** Buyer downloads a zip, uploads to a fresh Shopify dev store, sees their personalized landing page render correctly.

## ⏳ Phase 7 — Account + license

- [ ] `@neondatabase/auth` integration (or simpler magic-link if it doesn't fit).
- [ ] `/account/downloads`: list orders, re-download zips (signed URLs, expiring), see license key.
- [ ] License key validation endpoint (for Shopify/Woo zips to check at install time, optional).

**Exit criterion:** Buyer can sign in months later and re-download.

## ⏳ Phase 8 — Marketing site visual redesign

- [ ] Receive the Claude Design output for the marketing site.
- [ ] Port the chosen design into `src/app/page.tsx` and supporting components, replacing the current placeholder.
- [ ] Final pass on `/playbook` typography to match the marketing site's editorial tone.

**Exit criterion:** The site looks like the people behind it have taste.

## Backlog (post-launch)

- 5th and 6th niche presets (apparel? candles? books?).
- Multi-vendor mode (let other designers sell themes through ShopLanding).
- Subscription tier ($19/mo all-themes-all-updates) once we have ≥5 themes.
- Linear/Notion-style "rule explorer" letting buyers diff their existing landing page against the 69 rules.
- Klaviyo / email-capture block.
