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

## ✅ Phase 3 — Niche presets + showcase (done)

- [x] [`scripts/seed-presets.ts`](../scripts/seed-presets.ts) populates 3 `LayoutPreset` rows — Skincare (Orelle · Daystick), Supplement (VitalStack · Daily Greens), Gadget (Aurabud Gen 2). Each carries niche-specific `tokens` (palette, fonts) and full `demoSeed` (product, benefits, steps, ingredients, reviews, press, FAQ, specs, cross-sells, comparison rows, brand). Each preset also gets all 7 playbook blocks linked via `PresetBlock` rows. Idempotent — re-runnable.
- [x] `/showcase` server component reads the presets from Neon and renders a 3-card gallery with palette swatches.
- [x] `/showcase/[slug]` mounts `<LandingRenderer>` with the preset's tokens + content. Route segment layout loads Fraunces + Inter + JetBrains Mono fonts; landing.css scoped via `.landing-root` doesn't bleed into marketing surfaces. `generateStaticParams` pre-builds all 3 routes; bad slugs 404.
- [x] Home-page theme cards now link to `/showcase/[slug]` (was dead anchors).
- [ ] "Blocks visible" overlay toggle on showcase pages — deferred, low value until we have a real second-screen buyer flow.

**Exit criterion met:** three visibly different landing pages — warm cream skincare, dark-mode neon-green supplement, electric-blue light-mode gadget — all built from the same `<LandingRenderer>` reading from the same DB schema.

## ⚙️ Phase 4 — Sales surface (code complete · awaiting test keys)

- [x] `Theme` rows seeded — `skincare-orelle` / `supplement-vitalstack` / `gadget-aurabud`, each priced $99 / $249 / +$199 (cents). [`scripts/seed-themes.ts`](../scripts/seed-themes.ts), `npm run seed:themes`.
- [x] `/themes/[slug]` sales page — niche meta grid, palette swatch + brand identity card with starting price, "View live demo ↗" button to `/showcase/[preset.slug]`, three-tier pricing band with form-action buy buttons. `generateStaticParams` pre-builds all 3 routes; bad slugs 404.
- [x] Stripe wrapper [`src/lib/stripe.ts`](../src/lib/stripe.ts) — lazy client, won't crash boot if keys are missing, exposes `isStripeConfigured()` so the UI can gate buttons.
- [x] License helpers [`src/lib/license.ts`](../src/lib/license.ts) — `generateLicenseKey()` → `SHOP-XXXX-XXXX-XXXX-XXXX`, `generatePreviewSlug()` → 12-char URL-safe random.
- [x] Server action [`src/app/buy/actions.ts`](../src/app/buy/actions.ts) — builds a one-shot Checkout Session in payment mode, stores `themeId/themeSlug/tier` in metadata so the webhook can mint the Order without round-tripping, redirects to `session.url`.
- [x] Webhook [`src/app/api/stripe/webhook/route.ts`](../src/app/api/stripe/webhook/route.ts) — verifies signature against raw body, idempotent on `checkout.session.completed`, creates `Order` with `status=paid` + license key + preview slug. Other event types acknowledged as no-ops.
- [x] Return page [`src/app/buy/success/page.tsx`](../src/app/buy/success/page.tsx) — looks up the Order by `stripeSessionId`, shows license key + preview URL, falls back to a "still processing…" state if the redirect beats the webhook.
- [x] Home `ThemeCatalog` cards now point at `/themes/[slug]` (sales page) instead of `/showcase/[slug]` (live demo). Sales page links onward to the live demo.
- [x] Home `Pricing` informational tiers now scroll to `#themes` ("Pick a theme →") rather than disabled buttons.

**Exit criterion (pending test keys):** Test-mode buyer can complete checkout and see an `Order` row appear with a license key. To enable:
1. Add `STRIPE_SECRET_KEY=sk_test_…` to `.env.local`.
2. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
3. Click any "Buy" button on `/themes/[slug]` → land on Stripe Checkout → use `4242 4242 4242 4242` → return to `/buy/success?session_id=…` → see your license key.

## ✅ Phase 5 — Tweaks-panel intake + preview (done)

- [x] [`src/components/landing/TweaksPanel.tsx`](../src/components/landing/TweaksPanel.tsx) — focused TS port of the handoff panel. Floating bottom-right pill expands into a glass panel with **palette** (3 color rows w/ swatch + hex input), **type** (display-font select), and **copy** (CTA button text). Two modes:
  - `"persisted"` (default) — Save calls the server action, writes to `Order.tweaks`.
  - `"ephemeral"` — pure client state for marketing demos; no persistence.
- [x] [`src/app/preview/actions.ts`](../src/app/preview/actions.ts) — `saveOrderTweaks({ previewSlug, tweaks })` server action. Sanitizes JSON: only the 12 allowed token keys + `ctaCopy` survive, length-bounded. Auth via `previewSlug` (the URL is the unguessable shared secret until Phase 7 layers in account ownership). `revalidatePath` is wrapped defensively so test harnesses don't crash on missing static-generation store.
- [x] [`src/app/preview/[previewSlug]/page.tsx`](../src/app/preview/[previewSlug]/page.tsx) — buyer's persistent preview. Loads the order + theme + preset, renders `<LandingRenderer>` with the merged tokens + content, mounts `<TweaksPanel mode="persisted">`. Top-left ribbon shows the theme name + license key. 404 on unknown slug.
- [x] [`src/app/preview/[previewSlug]/layout.tsx`](../src/app/preview/[previewSlug]/layout.tsx) — Fraunces + Inter + JetBrains Mono fonts loaded; `landing.css` imported (scoped via `.landing-root`).
- [x] **Live preview UX:** palette + display-font changes apply *instantly* by writing CSS variables onto `.landing-root` via `setProperty`. No server round-trip until Save. CTA-copy changes persist on save and apply on next view (the renderer bakes ctaCopy into JSX).
- [x] Sanitization tested end-to-end: malicious keys dropped, over-length strings rejected, bad slugs return `{ ok: false }`.

**Exit criterion met:** test order + previewSlug routes 200, panel mounts, save action persists. Verified end-to-end.

Future polish (deferred):
- [x] Anonymous "try the panel" surface on `/showcase/[slug]` — `<TweaksPanel mode="ephemeral" defaultOpen>` mounts on every preset demo. Visitors land, see the panel open, change accent → page recolors live, no persistence.
- [ ] Account-ownership check layered onto `previewSlug` once auth lands in Phase 7.

## ✅ Marketing polish (post-Phase 8)

- [x] **Tweaks panel on showcase** — auto-opens, ephemeral mode, palette + font + CTA-copy controls.
- [x] **`/showcase` index thumbnails** — replaced palette-swatch cards with full `PresetMock` hover-swap thumbnails (front buy box ↔ back view per niche), matching the home-page catalog cards.
- [x] **OG + Twitter meta** in [`src/app/layout.tsx`](../src/app/layout.tsx) — `metadataBase`, title template, description, OpenGraph block, Twitter summary card.
- [x] **`/sitemap.xml`** via [`src/app/sitemap.ts`](../src/app/sitemap.ts) — DB-driven, surfaces public marketing pages + showcase + theme sales pages.
- [x] **`/robots.txt`** via [`src/app/robots.ts`](../src/app/robots.ts) — disallows `/api/`, `/preview/`, `/buy/`, `/dev/`; emits canonical sitemap link.

## ⚙️ Phase 6 — Theme packagers (foundation done · real Liquid/PHP emitters TODO)

End-to-end download flow lands; format-specific emitters are stubbed and ship in follow-up PRs.

- [x] [`src/lib/packagers/types.ts`](../src/lib/packagers/types.ts) — `ARTIFACT_KINDS = ["spec", "shopify", "woo"]`, shared `PackagerInput` / `PackagerOutput` types.
- [x] [`src/lib/packagers/spec.ts`](../src/lib/packagers/spec.ts) — **real exporter.** Generates `spec.json` + `tokens.css` + `content.md` + `block-order.json` + `README.md` + `LICENSE.txt` (with traceable license key). Sample output: 8 KB compressed, 18 KB raw, 6 files.
- [x] [`src/lib/packagers/shopify.ts`](../src/lib/packagers/shopify.ts), [`woo.ts`](../src/lib/packagers/woo.ts) — placeholder zips that bundle the spec inside, plus a README explaining the gap. Same URL contract as the real emitters; only the contents will change later.
- [x] [`src/lib/packagers/index.ts`](../src/lib/packagers/index.ts) — `packageThemeArtifact({ presetSlug, kind, tweaks, licenseKey, version })` orchestrator that looks up the preset, merges tweaks, dispatches to the right format builder.
- [x] [`src/lib/download-token.ts`](../src/lib/download-token.ts) — HMAC-SHA256 tokens keyed off the order's `licenseKey`. Format `b64url(payload).b64url(sig)`, with `payload = orderId:kind:expiresAtMs` and a 7-day TTL. Constant-time compare; tampered tokens rejected.
- [x] [`src/app/api/download/[orderId]/[kind]/route.ts`](../src/app/api/download/[orderId]/[kind]/route.ts) — signed download endpoint. Verifies token, builds artifact on-demand from preset + buyer tweaks, streams the zip with `Content-Disposition: attachment`. Build-on-demand keeps storage free; no blob CDN needed for v1.
- [x] [`src/app/api/dev/package/[presetSlug]/[kind]/route.ts`](../src/app/api/dev/package/[presetSlug]/[kind]/route.ts) — unsigned dev-only endpoint for inspecting packager output without an Order. Returns 404 in production.
- [x] `/buy/success` mints a fresh signed URL for each artifact and renders three download buttons.
- [x] **Shopify Liquid emitter (v1)** — full Shopify CLI 3 theme structure in [`src/lib/packagers/shopify.ts`](../src/lib/packagers/shopify.ts). Real working sections: `announcement-bar`, `header`, `hero-product` (full buy box with variants, qty, ATC, trust row, Schema.org JSON-LD), `footer`, `sticky-atc`, `final-cta`. Stub sections for press/benefits/how-it-works/comparison/ingredients/reviews/ugc/cross-sell/founder/specs/faq install cleanly and accept content via theme editor; full per-section logic ships in v1.x. The buyer's preset tokens (palette + fonts) flow through as theme settings to `config/settings_data.json`. Generated zip: ~30 KB, 30+ files, validated structurally (JSON parses, all 18 sections have balanced schema blocks, settings IDs cover all 13 palette/type tokens). Per-preset values verified end-to-end (skincare sage / supplement emerald / gadget blue).
- [ ] **Real Woo child-theme emitter** — Storefront/Blocksy child theme + activation plugin registering a "Single Product Landing" page template.
- [ ] **Move to blob storage** once we have CDN edge caching to worry about; current build-on-demand is fine until traffic justifies caching.

**Exit criterion (foundation):** ✅ Buyer (or test order) can hit `/api/download/[orderId]/[kind]?token=…` and receive a real signed zip whose contents include the buyer's license key. Verified end-to-end in dev.

## ⚙️ Phase 7 — Account + license (code complete · awaiting Neon Auth provisioning)

- [x] [`src/lib/auth/server.ts`](../src/lib/auth/server.ts) — `getAuth()` (singleton, throws on missing env), `isAuthConfigured()` (boolean), `getSignedInUser()` (never-throws, returns null on missing session), `requireSignedInUser({ callbackURL })` (server-side guard, redirects to `/auth/sign-in` or `/account/setup-auth` if env unset).
- [x] [`src/lib/auth/client.ts`](../src/lib/auth/client.ts) — `authClient` for client components.
- [x] [`src/components/auth/AuthProviders.tsx`](../src/components/auth/AuthProviders.tsx) — `<NeonAuthUIProvider>` wrapper, scoped to `/auth/*` and `/account/*` (not in root layout — marketing pages don't need it).
- [x] [`src/components/auth/StyledAuthView.tsx`](../src/components/auth/StyledAuthView.tsx) — defers Neon's `<AuthView>` mount one microtask to avoid SSR/CSR class mismatch.
- [x] [`src/app/auth/[path]/page.tsx`](../src/app/auth/[path]/page.tsx) — sign-in / sign-up / forgot-password etc., statically generated from Neon's `authViewPaths`.
- [x] [`src/app/api/auth/[...path]/route.ts`](../src/app/api/auth/[...path]/route.ts) — same-origin proxy forwarding all five HTTP methods. Returns 503 JSON cleanly when env unset (instead of crashing).
- [x] [`src/app/account/downloads/page.tsx`](../src/app/account/downloads/page.tsx) — buyer's order list with **fresh 7-day signed download URLs minted on every page load**. Matches orders by either `userId` (post-auth) or `email` (pre-auth Stripe orders).
- [x] [`src/app/account/setup-auth/page.tsx`](../src/app/account/setup-auth/page.tsx) — graceful "operator note" landing for the unconfigured state. Walks through: Neon Auth project URL, `openssl rand -base64 32`, `.env.local` keys, restart.
- [x] Marketing nav has "Account" link (visible on ≥sm screens) pointing to `/account/downloads`.
- [x] `/buy/success` nudges new buyers to create an account so future downloads stick around.
- [x] `.env.example` documents `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET`.

**Graceful degradation verified:** with no `NEON_AUTH_*` env vars set, marketing/showcase/theme pages stay 200, auth surfaces 307 to `/account/setup-auth` instead of crashing, and `/api/auth/*` returns structured 503 JSON.

**Exit criterion (pending Neon Auth provisioning):** Buyer can sign in months later and re-download. To enable:
1. Provision a Neon Auth project in the Neon dashboard.
2. `NEON_AUTH_BASE_URL=https://<project>.neonauth.<region>.aws.neon.tech/<db>/auth`
3. `NEON_AUTH_COOKIE_SECRET=$(openssl rand -base64 32)`
4. Restart `npm run dev` → `/auth/sign-in` renders the AuthView, `/account/downloads` lists orders with live download tokens.

Future:
- [ ] License key validation endpoint for Shopify/Woo zips at install time (optional).
- [ ] Migrate `Order.userId` from email → real user-id column once enough buyers exist for the migration to matter.

## ✅ Phase 8 — Marketing site visual redesign (Option A · Catalog)

Picked from three explorations (`public/explorations/06-catalog.html`, `07-annotated.html`, `08-bento.html`). Researched against Cruip, Tailwind Plus, Untitled UI, Shopify Theme Store.

- [x] Hero replaced — eyebrow + headline + sub + 2 CTAs + 3-up tilted preset stack + dark price strip. No iframe.
- [x] `ThemeCatalog` — 3-card grid (Orelle · Skincare / VitalStack · Supplement / Aurabud · Gadget). Hover crossfades between front and back mock views. `69 / 69 rules` chip per card, explicit `$99 · single store` price + Live demo link.
- [x] `AnnotatedProof` — static rendered PDP with 4 clickable pins. Side panel updates live with the CRO rules each block satisfies. Sticky on desktop.
- [x] `Comparison` — replaced the 3-column table with a side-by-side "without · with" two-card pattern, callout pills on each (`No urgency` / `+ bundle picker`).
- [x] `PresetMock` shared primitive — used in the hero stack and in both faces of every theme card.
- [x] Removed: `LiveBlockShowcase`, `LogoStrip`, `HowItWorks`, `Benefits`, `Founder`, `LiveDemoFrame`. Plus `BENEFITS`, `STEPS`, `COMPARISON`, `FOUNDER_QUOTE`, `LOGO_STRIP` from `copy.ts`.
- [x] `page.tsx` flow: `AnnouncementBar → Nav → Hero → ThemeCatalog → AnnotatedProof → Comparison → Pricing → Faq → FinalCta → Footer → StickyCta`. Eight surfaces. No manifesto.
- [ ] Final pass on `/playbook` typography to match the marketing site's editorial tone (deferred — `/playbook` still uses zinc grey body type).

**Exit criterion met:** the catalog grid + annotated proof + without/with comparison answer "what am I buying" within the first scroll. Real product photography to swap in for the CSS gradient placeholders when shoots happen.

## Backlog (post-launch)

- 5th and 6th niche presets (apparel? candles? books?).
- Multi-vendor mode (let other designers sell themes through ShopLanding).
- Subscription tier ($19/mo all-themes-all-updates) once we have ≥5 themes.
- Linear/Notion-style "rule explorer" letting buyers diff their existing landing page against the 69 rules.
- Klaviyo / email-capture block.
