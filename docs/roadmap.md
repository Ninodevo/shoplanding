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

## ⚙️ Phase 9 — PDP Audit tool (v1 shipped · adds the marketing flywheel)

After the strategic review, we pivoted from "build then sell themes" to **dogfooding via a digital product that builds the future-buyer audience on autopilot**. The audit tool is that product.

- [x] [`prisma/schema.prisma`](../prisma/schema.prisma) — new `Audit` model: `url`, `email?`, `rawResult` (full scored breakdown JSON), `score` 0–100, `source`, `ipHash`, indexed by `createdAt` desc. Migration `add_audits` applied.
- [x] [`src/lib/audit/fetch.ts`](../src/lib/audit/fetch.ts) — safe URL fetcher. SSRF guard (private CIDR block), 5 MB cap, 15 s deadline, http/https-only, content-type sniffing, descriptive `FetchError` codes.
- [x] [`src/lib/audit/extract.ts`](../src/lib/audit/extract.ts) — cheerio-based parser → structured `ExtractedPage`. Extracts Schema.org Product JSON-LD (the gold standard), DOM section presence (reviews / FAQ / comparison / specs / gallery thumbs / press), 18+ keyword presence flags (free shipping / klarna / urgency / scarcity / live activity / etc.), counts (outgoing links, product images, videos), and numeric signals (rating, review count, price text, compare-at-price).
- [x] [`src/lib/audit/rules.ts`](../src/lib/audit/rules.ts) — 30 detectable rules across all 7 playbook blocks. Each returns `pass` / `fail` / `unknown` with a short note. Weighted 1–3 by impact. Honest "unknown" for judgment-call rules instead of guessing — surfaces as "manual review" in the report.
- [x] [`src/lib/audit/score.ts`](../src/lib/audit/score.ts) — aggregates per-block scores (excluding `unknown` from denominator), computes weighted overall, picks top 5 highest-weight fails.
- [x] [`src/app/audit/actions.ts`](../src/app/audit/actions.ts) — `runAudit` server action. URL normalization (auto-https), IP-hash rate limit (5 audits / 15 min), persists to DB, redirects to result page.
- [x] [`src/app/audit/page.tsx`](../src/app/audit/page.tsx) — landing page with URL input form, "what we check" 7-card block summary, honest "what we can/can't detect" section. SEO copy: "Audit any product page. Get a 0–100 score in 15 seconds."
- [x] [`src/app/audit/[id]/page.tsx`](../src/app/audit/[id]/page.tsx) — result page with animated SVG score dial (color-coded green/amber/red), "Top fixes ranked" section, full block-by-block per-rule list (pass / fail / manual icons + weight chips), and a closing CTA back to /#themes and /playbook.
- [x] Marketing nav now shows "Audit" link.

**Verified end-to-end against a real DTC store:** `drinkolipop.com/products/strawberry-vanilla` scored 61/100. Real findings surfaced — missing rating near title, no press logos detected, only 1 express-pay option mentioned, too many outgoing links. The audit row persists to Neon and renders at `/audit/[id]`.

### v1.1.a — Email gate (shipped)

- [x] [`src/app/audit/[id]/actions.ts`](../src/app/audit/[id]/actions.ts) — `unlockAuditWithEmail` server action. Validates email, persists to `Audit.email`, redirects back to the result page anchored at `#top-fixes`.
- [x] [`src/app/audit/[id]/page.tsx`](../src/app/audit/[id]/page.tsx) — refactored: score dial + product schema + per-block scoreboard are always public (proof of substance). Top fixes + per-rule breakdown are gated. Locked state shows three blurred preview rows + an email capture form. Once unlocked, the share link stays unlocked for every subsequent viewer — the marketing prize is the original auditor's email.

### v1.1.b — LLM pass (shipped)

- [x] [`src/lib/anthropic.ts`](../src/lib/anthropic.ts) — lazy Anthropic client wrapper. Won't throw at module load if the key is missing; mirrors the Stripe wrapper.
- [x] [`src/lib/audit/llm.ts`](../src/lib/audit/llm.ts) — `llmScoreUnknowns(page, rules)`. Single batched Anthropic call (Haiku by default) for every rule heuristics flagged `unknown`. Returns the rules array with verdicts merged in and `aiAssisted: true` on rewritten rows. Graceful no-op when `ANTHROPIC_API_KEY` is absent or the call fails — the audit still ships heuristic-only.
- [x] [`src/lib/audit/extract.ts`](../src/lib/audit/extract.ts) — extracts a cleaned 8 KB body-text snippet for the LLM.
- [x] [`src/lib/audit/rules.ts`](../src/lib/audit/rules.ts) — `RuleResult` carries an optional `aiAssisted` flag.
- [x] [`src/lib/audit/score.ts`](../src/lib/audit/score.ts) — `scoreAudit` accepts an optional pre-computed `rules` array so the action can splice in LLM-augmented verdicts.
- [x] [`src/app/audit/actions.ts`](../src/app/audit/actions.ts) — runs heuristics → LLM pass → score, in sequence. LLM step adds ~1 s when key is set, 1 ms when not.
- [x] [`src/app/audit/[id]/page.tsx`](../src/app/audit/[id]/page.tsx) — `<AiChip>` badge on LLM-scored rules. Explainer copy updated to surface the AI-vs-manual distinction honestly.
- [x] [`.env.example`](../.env.example) — `ANTHROPIC_API_KEY` + optional `ANTHROPIC_MODEL` documented.

**Known limit — rule coverage:** `rules.ts` currently defines 29 of the 69 playbook rules. Of those, the LLM pass picks up the ones that return `unknown` from heuristics (≈3 on a typical Shopify PDP). The framework scales straight to 69 — the next milestone is filling in the missing ~40 rule definitions (mostly `detect: () => unknown(...)` stubs the LLM then judges).

Deferred to v1.2 (Phase 11+):
- [ ] Expand `rules.ts` to cover all 69 playbook rules.
- [ ] Lemon Squeezy / Stripe paid tier on the audit ($19/mo unlimited).
- [ ] Competitor-comparison feature (audit your store + 3 competitors side-by-side).
- [ ] Embeddable "scored" widget for buyers to share their audit on Twitter.

## ✅ Phase 10 — Email nurture flywheel (shipped)

The audit tool was capturing emails and dropping them in a drawer — no follow-up, no theme upsell, dead-end after unlock. Phase 10 closes that loop: every unlock now fires a personalised email + a 3-step nurture sequence ending in a discount code on the niche-matched theme.

- [x] [`prisma/schema.prisma`](../prisma/schema.prisma) — Audit gets `unlockedAt`, `unlockEmailSentAt`, `nurtureDay3SentAt`, `nurtureDay7SentAt`. Migration `add_nurture_fields` applied.
- [x] [`src/lib/email.ts`](../src/lib/email.ts) — lazy Resend wrapper, same shape as Stripe/Anthropic clients. `sendEmail` returns `{ok}` and never throws — email failures must never break the action that triggered them.
- [x] [`src/lib/email/templates.ts`](../src/lib/email/templates.ts) — three single-CTA templates (`unlockEmail`, `nurtureDay3Email`, `nurtureDay7Email`) with HTML + plaintext. System fonts, 600px wide, inline-styled for client compatibility, visible opt-out footer.
- [x] [`src/lib/audit/niche.ts`](../src/lib/audit/niche.ts) — `recommendThemeFor(audit)` keyword-matches the audited page's title + schema name to one of the three themes (skincare-orelle / supplement-vitalstack / gadget-aurabud). Conservative — misses → `null` → generic CTA.
- [x] [`src/app/audit/[id]/actions.ts`](../src/app/audit/[id]/actions.ts) — `unlockAuditWithEmail` now writes `unlockedAt`, sends the unlock email synchronously (~400ms add), stamps `unlockEmailSentAt` on success. Soft-fails — if Resend isn't configured the unlock still completes.
- [x] [`src/app/api/cron/audit-nurture/route.ts`](../src/app/api/cron/audit-nurture/route.ts) — cron-secret-gated endpoint. Finds audits unlocked ≥3 days / ≥7 days ago without the matching send-stamp, fires the nurture email, stamps the row. Batch limit 100 per tick. Accepts `Authorization: Bearer $CRON_SECRET` (Vercel format) or `?token=$CRON_SECRET` (curl).
- [x] [`vercel.json`](../vercel.json) — Vercel cron schedules `audit-nurture` every 15 minutes.
- [x] [`src/components/marketing/Hero.tsx`](../src/components/marketing/Hero.tsx) — added "Audit your store — free" as the secondary hero CTA (the actual lead magnet is no longer hidden in the nav).
- [x] [`src/app/audit/[id]/page.tsx`](../src/app/audit/[id]/page.tsx) — after-unlock CTA replaced with a niche-aware recommendation card: matched theme name, evidence ("we saw 'serum' in the page"), single primary buy button + "See it live" showcase link. Falls back to the generic three-themes block when no match.
- [x] [`.env.example`](../.env.example) — `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`, `CRON_SECRET` documented.

**To turn on the pipeline in prod:**
1. Add `RESEND_API_KEY` + `CRON_SECRET` to Vercel env. (Optionally `RESEND_FROM` once a domain is verified.)
2. Redeploy. Vercel Cron picks up `vercel.json` automatically.
3. New audits unlock → user gets Email 1 immediately. Days 3 + 7 fire from cron.

Without those envs, the audit still works heuristic + LLM-only with no email flow, exactly as before.

## ✅ Phase 11 — Theme detail conversion + 69-rule audit coverage (shipped)

The audit funnel could now send people to `/themes/[slug]`, but that page made the buyer guess what they were getting (palette swatches + a brand tagline). Phase 11 puts the actual product on the page and proves the 69-rule claim with real data.

- [x] [`src/app/showcase/[slug]/page.tsx`](../src/app/showcase/[slug]/page.tsx) — `?embed=1` mode strips the Ribbon + TweaksPanel so the route can live inside an iframe.
- [x] [`src/components/marketing/ThemeLivePreview.tsx`](../src/components/marketing/ThemeLivePreview.tsx) — embedded live preview with browser chrome (faux URL bar) and desktop/mobile device toggle. Mobile mode renders the iframe inside a CSS phone bezel.
- [x] [`src/components/marketing/RuleCoverage.tsx`](../src/components/marketing/RuleCoverage.tsx) — server component that reads the 7 `Block` rows from Postgres and renders all 69 rules as expandable checklist cards. Backs the "69 / 69" badge with actual data instead of asking the buyer to trust it.
- [x] [`src/app/themes/[slug]/page.tsx`](../src/app/themes/[slug]/page.tsx) — drops in `<ThemeLivePreview>` + `<RuleCoverage>` between the header and pricing. Buy-page now contains: header → live preview → 69-rule proof → pricing. Header CTA flipped: primary = "See pricing", secondary = "Customize colors + copy ↗" (opens the standalone showcase with the tweaks panel).
- [x] [`src/lib/audit/rules.ts`](../src/lib/audit/rules.ts) — expanded from 29 to **all 69** playbook rules. ~30 keep meaningful heuristics; ~40 declare `unknown` with a one-line rationale and let the LLM pass judge them. Olipop now produces ~42 unknowns per audit instead of 3 — the LLM finally earns its keep.
- [x] [`src/lib/audit/llm.ts`](../src/lib/audit/llm.ts) — `max_tokens` raised 1500 → 4000 to safely hold the larger verdict batch.

**Verified:** `npx tsx scripts/smoke-rules.ts` shows 69 rules total (4/6/9/23/8/9/10 per block, exactly matching the playbook), and a fresh heuristic run on `drinkolipop.com/products/strawberry-vanilla` returns 15 pass / 12 fail / 42 unknown — the 42 unknowns feed directly into the LLM pass.

## ✅ Phase 12 — Swap Stripe → Lemon Squeezy (shipped)

The Croatian d.o.o. is the legal seller on every Stripe transaction, which means OSS VAT for the EU (27 rates, quarterly), separate UK VAT post-Brexit, US sales-tax nexus filings for ~30 states on digital products, plus chargeback / fraud handling. Lemon Squeezy is merchant of record — they collect + remit all of that — for roughly +2% per transaction. At our pricing ($99–$249) that's $2–5/sale to avoid €1,500–3,000/yr in accountant + filing fees plus the audit risk. Trivially worth it.

- [x] [`prisma/schema.prisma`](../prisma/schema.prisma) — `Order` columns made provider-agnostic: `stripeSessionId` → `providerOrderId` (still unique), `stripePaymentIntentId` dropped, `provider String @default("lemonsqueezy")` added. `Theme` gets `lsVariants Json?` for the `{ single, unlimited, setup }` LS variant-ID mapping per theme. Migration `swap_stripe_to_lemonsqueezy` (hand-written because the rename triggers a Prisma interactive prompt) applied to Neon — verified `orders` was empty first.
- [x] [`src/lib/lemonsqueezy.ts`](../src/lib/lemonsqueezy.ts) — lazy SDK wrapper mirroring the Anthropic / Resend pattern. Exports `isLemonSqueezyConfigured()`, `asThemeLsVariants()` (JSON guard), `createLemonCheckoutUrl()`, and `verifyLemonSqueezySignature()` (HMAC-SHA256, timing-safe compare, same scheme as Stripe just `X-Signature` header).
- [x] [`src/app/buy/actions.ts`](../src/app/buy/actions.ts) — `createCheckoutSession` rewritten: resolves the LS variant for `(theme, tier)`, calls LS to mint a hosted checkout URL with `meta.custom_data = { themeId, themeSlug, tier }`, redirects browser to it.
- [x] [`src/app/api/lemonsqueezy/webhook/route.ts`](../src/app/api/lemonsqueezy/webhook/route.ts) — replaces the Stripe webhook. Verifies signature, dispatches on `meta.event_name`, handles `order_created` (mints Order with license key + preview slug + LS `data.id` stored as `providerOrderId`). Other events 200-ack so LS stops retrying.
- [x] [`src/app/buy/success/page.tsx`](../src/app/buy/success/page.tsx) — looks up by `providerOrderId` from `?order_id=…` (LS's redirect query param). Copy updated.
- [x] [`src/app/themes/[slug]/page.tsx`](../src/app/themes/[slug]/page.tsx) — `isStripeConfigured` → `isLemonSqueezyConfigured` AND `Theme.lsVariants !== null`. Disabled-button copy now mentions LS + the missing-variants step. Footer line: "Secure checkout via Lemon Squeezy · VAT / sales tax handled for you."
- [x] Stripe code removed: deleted `src/lib/stripe.ts` + `src/app/api/stripe/webhook/route.ts`. `npm uninstall stripe`, `npm install @lemonsqueezy/lemonsqueezy.js@^4`.
- [x] [`.env.example`](../.env.example) — Stripe block replaced with `LEMONSQUEEZY_API_KEY` / `LEMONSQUEEZY_STORE_ID` / `LEMONSQUEEZY_WEBHOOK_SECRET` (no `NEXT_PUBLIC_*` needed — LS has no client-side keys).

**Verified end-to-end on dev:**
- Theme pages render 200 with the LS-not-configured gate showing the correct copy (no Stripe leakage).
- Webhook returns 500 with `LEMONSQUEEZY_WEBHOOK_SECRET not configured` when the secret is unset, 401 on bad signatures once it is.

**Manual steps left for the founder:**
1. Sign up at lemonsqueezy.com, complete KYC (~24h).
2. Create a Store. Inside it, create one Product per Theme with three Variants priced exactly the same as `priceSingleCents` / `priceUnlimitedCents` / `setupAddOnCents` ($99 / $249 / $199).
3. Copy variant IDs into a JSON object per theme, e.g.:
   ```sql
   UPDATE themes SET ls_variants = '{"single":12345,"unlimited":12346,"setup":12347}'::jsonb WHERE slug = 'skincare-orelle';
   ```
4. Drop `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET` into `.env.local` + Vercel.
5. Add webhook URL `https://shoplanding.io/api/lemonsqueezy/webhook` in the LS dashboard, sign with the secret you set in step 4, subscribe to `order_created`. (Add `subscription_created` / `subscription_payment_success` later when the audit Pro tier ships.)

## ✅ Phase 15 — Real Shopify sections: zero stubs (shipped)

The Shopify zip had 11 empty stub sections while the marketing claimed "69/69 out of the box" — the single biggest sell-honesty gap. Phase 15 replaces every stub with real Liquid.

- [x] [`src/lib/packagers/shopify-sections.ts`](../src/lib/packagers/shopify-sections.ts) (new, ~900 lines) — 11 real sections: press, benefits, how-it-works, comparison, ingredients, **reviews** (aggregate score + star-distribution bars computed in Liquid + verified/occupation/age cards, tinted band per rule 51, anchored `#reviews`), ugc, cross-sell (native `product_list` picker with seeded fallback cards), founder, specs, **faq** (native `<details>` accordion, zero JS, anchored `#faq`). Plus `SECTIONS_CSS` (~130 lines) in the same token vocabulary as the base sheet.
- [x] **Architecture**: section `.liquid` files are content-agnostic (render logic + generic schema defaults so "Add section" works anywhere); the buyer's seeded content is baked into `templates/product.json` via `buildSectionTemplateEntries()` — the OS 2.0 mechanism where template JSON overrides schema defaults. Theme renders fully populated on install.
- [x] [`src/lib/packagers/shopify.ts`](../src/lib/packagers/shopify.ts) — stub factory deleted, real sections wired, README rewritten (17 functional sections listed, no "stub" language).
- [x] [`scripts/validate-shopify-zip.ts`](../scripts/validate-shopify-zip.ts) — packages a preset from the DB and validates like Shopify's uploader: every `{% schema %}` parses as JSON, all template/config JSON parses, zero stub markers, per-section seeded block counts match the demo seed. **All 3 presets PASS.**

Still open before selling:
- [x] Installed on a real Shopify store (shoplanding-mulltz8q, theme id 158371381295). Live rendering caught + fixed 3 bugs (empty-drop image_url crash, mailto support URL, duplicate ticker line). Full landing page verified end-to-end with a real product: live price math, sale badge, all 14 sections, zero Liquid errors.
- [x] WooCommerce: real emitter shipped in Phase 16 (below).

## ✅ Phase 16 — Real WooCommerce emitter: a plugin, not a theme (shipped)

The Woo artifact was a README placeholder. It's now a real WordPress plugin.

**Why a plugin:** a theme forces the buyer to abandon their site's theme; a plugin drops into whatever they run, registers a "ShopLanding — Product Landing" page template, and renders the full landing page for one WooCommerce product on any Page that selects it.

- [x] [`src/lib/packagers/woo.ts`](../src/lib/packagers/woo.ts) — full rewrite (~900 lines). Emits `shoplanding-landing/` plugin: bootstrap (template registration + scoped asset enqueue + WC-missing admin notice), `includes/render.php` (16 escaped render functions — hero buy box with live Woo pricing/`add-to-cart`, press, benefits, steps, comparison, ingredients, reviews, social wall, cross-sell, founder, specs, FAQ `<details>` accordion, final CTA, sticky ATC, Schema.org JSON-LD), page template shell, CSS (preset tokens + the same `SECTIONS_CSS` the Shopify theme uses), JS, WP `readme.txt`, README, LICENSE.
- [x] **Content strategy:** all copy seeded into `includes/content.json` (JSON, not PHP arrays — generation can't produce parse errors, buyers edit plain JSON). `product_id` in the same file; falls back to the newest published product. Simple products get inline ATC + qty stepper; variable products get a "Choose options" link to the native product page (documented).
- [x] [`scripts/validate-woo-zip.ts`](../scripts/validate-woo-zip.ts) — extracts the zip, runs **`php -l`** (real PHP 8.3 linter) on every `.php` file, parses content.json, verifies per-section seeded counts + that every `sl_render_*` the template calls exists. **All 3 presets PASS.**
- [x] Delivery gates re-opened: `DELIVERABLE_ARTIFACT_KINDS` + download route include `woo` again; label is "WooCommerce plugin zip". `/buy/success` + `/account/downloads` show all three artifacts.
- [x] Marketing restored to "both platforms" — now true: hero sub, announcement, FAQ ("Shopify or WooCommerce — which one do I get?" → both, plugin explained), pricing bullets, theme detail (Platforms row, tier bullets, pricing intro), /about, metadata, OG image, footer.

- [x] **Rendered validation done** — plugin activated on a real WordPress + WooCommerce (via WordPress Playground CLI, blueprint installs Woo + creates a product + a page with the template). Caught + fixed one real bug: `get_header()` let the host theme (TT21) squeeze the page into its ~650px content column with its own nav above. Template is now a blank-canvas shell (own doctype + wp_head/wp_footer) — full-width, no host nav, which also matches the playbook's no-outgoing-nav rule. Verified visually: buy box with live Woo sale pricing, sticky ATC, all 14 sections.

## Backlog (post-launch)

- 5th and 6th niche presets (apparel? candles? books?).
- Multi-vendor mode (let other designers sell themes through ShopLanding).
- Subscription tier ($19/mo all-themes-all-updates) once we have ≥5 themes.
- Linear/Notion-style "rule explorer" letting buyers diff their existing landing page against the 69 rules.
- Klaviyo / email-capture block.
