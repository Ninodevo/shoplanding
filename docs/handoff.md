# Handoff bundle

`handoff/` contains the design output from claude.ai/design that seeded this project. Treat it as **read-only reference material** — we *port* from it; we don't edit it. The bundle's own README is at [`handoff/README.md`](../handoff/README.md).

## What's in there

```
handoff/
├── README.md                              # original design-tool handoff notes
└── project/
    ├── Kerrimi Pocket Butter.html         # concrete branded example
    ├── components.jsx                     # React components for the Kerrimi page
    ├── styles.css                         # Kerrimi page styles
    ├── tweaks-panel.jsx                   # runtime tweak primitive
    ├── assets/
    │   └── pocket-butter.png              # demo product photography
    ├── template/
    │   ├── Landing Template.html          # generic single-product landing template
    │   ├── components.jsx                 # template's component set
    │   └── styles.css
    ├── templates/                         # earlier iteration; ignore
    │   └── ...
    └── uploads/
        └── checklist.xlsx                 # Conversion.design CRO checklist
```

## How we use each piece

### `project/template/Landing Template.html` + `template/components.jsx`

**Source of truth for `<LandingRenderer>`.** The `App()` function at the bottom of the HTML enumerates the canonical render order — that's what produced the 20 `RenderedBlock` rows in the DB. Port these into a real React Server Component when Phase 2 starts.

Notable things to preserve when porting:

- Schema.org Product JSON-LD in the `<head>` — drive it from `content`.
- OG/Twitter meta — drive from `content`.
- Sticky-on-scroll behavior for `StickyAtcBar` and `StickyProductBar` — these are the two real client islands. Everything else is server-renderable.
- Free-shipping progress bar math — keep it dumb client-side; recompute from cart total.

### `project/Kerrimi Pocket Butter.html` + `components.jsx` + `styles.css`

A concrete branded example using the same anatomy. **This becomes the skincare `LayoutPreset`** in Phase 3 — the palette, type, scent variants, bundle picker, and subscription frequency are all defaults we can lift verbatim.

### `project/tweaks-panel.jsx`

The runtime tweak primitive — a floating panel with sections, radios, selects, persisted to `localStorage`. We promote this from "design-time toy" to **buyer intake form** in Phase 5. Key changes when porting:

- Persist to server (`Order.tweaks`) instead of `localStorage`.
- Drive the available tweaks from a typed `TweakSchema` per preset, not hand-coded.
- Render in two contexts: pre-purchase preview (anonymous, optimistic, lost on refresh) and post-purchase preview (authenticated, persisted).

### `project/uploads/checklist.xlsx`

The Conversion.design landing-page CRO checklist. Sheet `🛬  Landing page` (note the double space) is the one we parse — 69 rules across 7 sections, already seeded into `Block.mustInclude` by `scripts/seed-blocks.ts`. Other sheets (Home page, Cart page, Checkout page) are out of scope for v1.

## Don't

- Don't render the handoff HTML files in a browser to "see what they look like" — read the source. Everything you need is in the markup. The handoff README spells this out.
- Don't keep the handoff in sync with the renderer once we've ported. They will diverge intentionally.
- Don't ship `handoff/` to production. It's reference-only and gitignored from the deploy in due course (currently committed for traceability).
