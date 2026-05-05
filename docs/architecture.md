# Architecture

## Stack

Mirror `~/work/private/rule1-advisor` everywhere it makes sense.

- **Framework:** Next.js 16 (App Router, Turbopack default). Read `node_modules/next/dist/docs/` before reaching for training-data conventions — Next 16 has breaking changes.
- **Runtime:** React 19.2.
- **Language:** TypeScript 5, strict.
- **Styling:** Tailwind v4 via `@tailwindcss/postcss`. Geist + Geist Mono via `next/font/google`.
- **DB:** Neon (PostgreSQL).
  - Pooled URL → `DATABASE_URL` (used by the app).
  - Direct URL → `PRISMA_MIGRATE_DATABASE_URL` (used by `prisma migrate` only — Neon poolers can time out on Prisma's advisory lock with P1002).
- **ORM:** Prisma 7.8 with the `@prisma/adapter-pg` driver adapter on a `pg` pool. Generated client output: `src/generated/prisma/client`.
- **Auth:** `@neondatabase/auth` (planned for buyer accounts).
- **Payments:** Stripe Checkout (planned).
- **File storage:** Vercel Blob or S3 for theme zips + signed download URLs (planned).

Explicitly *not* in stack: `@ai-sdk/openai` (no AI-generated showcase copy — seed content is hand-written and stored in DB).

## Data model

Six models. Two-tier block taxonomy is the heart of the system.

```
Block (7)              ──┐
  ↑ slug                 │ many-to-many via JSON `satisfies`
RenderedBlock (20)     ──┘

LayoutPreset ──< PresetBlock >── Block
LayoutPreset ──< Theme ──< Order
```

| Model | Purpose |
|---|---|
| `Block` | One of 7 CRO sections (the *playbook taxonomy*). Owns `mustInclude`, `pitfalls`, `checklistRefs` back to the 🛬 sheet. |
| `RenderedBlock` | One of 20 React components actually shipped (the *renderer taxonomy*). `satisfies` JSON links to playbook blocks. |
| `LayoutPreset` | A niche-tuned ordering of blocks + palette tokens + demo seed content. |
| `PresetBlock` | Join row: which `Block`s appear in which preset, in what order, with optional content overrides. |
| `Theme` | Sellable SKU wrapping a preset, with versioned Shopify zip / Woo zip / system-spec URLs and three price columns (single / unlimited / setup add-on, in cents). |
| `Order` | A purchase. Contains `tweaks` JSON (buyer-supplied brand/palette/copy), `licenseKey`, `previewSlug`, Stripe IDs. |

See [`prisma/schema.prisma`](../prisma/schema.prisma) for the source of truth.

## File layout

```
shoplanding/
├── AGENTS.md             # top-level agent rules
├── CLAUDE.md             # references AGENTS.md
├── docs/                 # this folder
├── handoff/              # Claude Design handoff (reference, do not modify)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── ...
├── prisma.config.ts      # dual DATABASE_URL / PRISMA_MIGRATE_DATABASE_URL handling
├── public/
├── scripts/
│   ├── seed-blocks.ts          # parses the 🛬 sheet → Block rows
│   ├── seed-rendered-blocks.ts # hand-curated → RenderedBlock rows
│   └── seed-presets.ts         # (todo) niche LayoutPreset rows
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx            # marketing home
│   │   ├── playbook/page.tsx   # block library
│   │   ├── showcase/           # (todo) live demos
│   │   ├── themes/[slug]/      # (todo) theme sales pages
│   │   ├── preview/[slug]/     # (todo) buyer's personalized preview
│   │   └── account/            # (todo) auth + downloads
│   ├── lib/
│   │   └── db.ts               # Prisma + pg pool singleton
│   └── generated/prisma/       # generated, gitignored
└── .env.local                  # gitignored
```

## Conventions

- **Server components by default.** Client islands only where state demands it (sticky-on-scroll, tweak panel).
- **Path alias** `@/*` → `./src/*`. Same as rule1-advisor.
- **Migrations are immutable** once applied to Neon. To change schema, write a new migration. Never edit a deployed migration's SQL.
- **Seeds are idempotent.** Every `seed:*` script uses `upsert`. Safe to re-run after schema or content tweaks.
- **No comments explaining what code does.** Only comments for non-obvious *why* (see `prisma.config.ts` for an example — explains why we pin `verify-full` and split URLs).
- **No `git push`, no destructive git ops, no commits unless the user explicitly asks.**

## Environment

`.env.local` (gitignored, never commit):

```
DATABASE_URL="postgres://...-pooler.../neondb?sslmode=require&channel_binding=require"
PRISMA_MIGRATE_DATABASE_URL="postgres://.../neondb?sslmode=require&channel_binding=require"  # non-pooler host
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# planned
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Direct (non-pooler) URL is derived from the pooled URL by stripping `-pooler` from the hostname.

## Common commands

```bash
npm run dev                 # next dev (runs prisma generate first)
npm run build               # prisma migrate deploy && next build
npx prisma migrate dev      # create + apply a new migration locally
npx prisma generate         # regenerate the client after a schema edit
npm run seed:blocks         # populate Block from the 🛬 sheet
npm run seed:rendered       # populate RenderedBlock
npm run seed:presets        # (todo) populate LayoutPreset + PresetBlock
```
