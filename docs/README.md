# ShopLanding — project docs

Living plan for ShopLanding. Read these in order if you're new.

| File | What it covers |
|---|---|
| [product.md](product.md) | What we sell, who buys it, the system framing |
| [architecture.md](architecture.md) | Stack, data model, file layout, conventions |
| [roadmap.md](roadmap.md) | What's done, what's next, ordered |
| [pricing.md](pricing.md) | Pricing model + reasoning |
| [handoff.md](handoff.md) | Guide to the `handoff/` reference bundle |

Top-level project guidance lives in [`AGENTS.md`](../AGENTS.md) (loaded automatically by Claude Code via `CLAUDE.md`). These files go deeper.

## One-paragraph pitch

ShopLanding sells a *system* — not just themes — for high-converting single-product landing pages. The system is **7 CRO blocks** distilled from the Conversion.design landing-page checklist (69 rules), implemented as **20 rendered React components**, and shipped as **Shopify + WooCommerce theme zips** plus a portable system spec. Buyers personalize via a tweaks panel at checkout (brand, palette, copy, fonts, hero image) and receive zips pre-baked with their content.

## Status snapshot

- ✅ Scaffold: Next 16 + React 19 + Tailwind v4 + Prisma 7 + Neon
- ✅ Schema: `Block`, `RenderedBlock`, `LayoutPreset`, `PresetBlock`, `Theme`, `Order` (migrations applied to Neon)
- ✅ Seeded: 7 playbook blocks from the 🛬 sheet, 20 rendered components from the handoff template
- ✅ `/` homepage + `/playbook` page reading from the DB
- ✅ `<LandingRenderer>` ported from `handoff/project/template/Landing Template.html` — visible at `/dev/render-test`
- ⏳ `/showcase` with 4 niche presets (skincare, food/CPG, gadget, supplement)
- ⏳ Stripe checkout, license issuance, downloads
- ⏳ Tweaks-panel intake at purchase
- ⏳ Theme packagers (Shopify `.zip` + Woo `.zip`)
- ⏳ Marketing site visual redesign (Claude Design brief sent — waiting)

See [roadmap.md](roadmap.md) for the full sequence.
