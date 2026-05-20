/**
 * Pre-deploy health check. Verifies every external dependency the app
 * touches and prints a launch-readiness summary. Safe to run repeatedly;
 * makes one tiny read call per service, never mutates anything.
 *
 * Run: npx tsx scripts/healthcheck.ts
 *
 * Exits 0 even with warnings — only outright auth failures (a key is set
 * but wrong) cause exit 1. Missing keys are reported as ⚠ and the script
 * keeps going so you see every issue in one pass.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { getPrisma } from "../src/lib/db";

type Result = { name: string; status: "ok" | "warn" | "fail"; detail: string };

async function main() {
  const results: Result[] = [];

  // ── 1. Postgres + migrations
  try {
    const prisma = getPrisma();
    const [auditCount, themeCount, blockCount] = await Promise.all([
      prisma.audit.count(),
      prisma.theme.count(),
      prisma.block.count(),
    ]);
    if (blockCount === 0)
      results.push({ name: "Postgres", status: "warn", detail: `connected, but 0 blocks (run \`npm run seed:blocks\`)` });
    else
      results.push({ name: "Postgres", status: "ok", detail: `${blockCount} blocks · ${themeCount} themes · ${auditCount} audits` });
  } catch (e) {
    results.push({ name: "Postgres", status: "fail", detail: msg(e) });
  }

  // ── 2. Anthropic
  if (!process.env.ANTHROPIC_API_KEY) {
    results.push({
      name: "Anthropic",
      status: "warn",
      detail: "ANTHROPIC_API_KEY not set — audit runs heuristic-only (no LLM scoring on the 40 qualitative rules)",
    });
  } else {
    try {
      const { getAnthropic, ANTHROPIC_MODEL } = await import("../src/lib/anthropic");
      const client = getAnthropic();
      const resp = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 8,
        messages: [{ role: "user", content: "Reply OK" }],
      });
      const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      results.push({ name: "Anthropic", status: "ok", detail: `${ANTHROPIC_MODEL} replied "${text.slice(0, 20)}"` });
    } catch (e) {
      results.push({ name: "Anthropic", status: "fail", detail: msg(e) });
    }
  }

  // ── 3. Resend
  if (!process.env.RESEND_API_KEY) {
    results.push({
      name: "Resend",
      status: "warn",
      detail: "RESEND_API_KEY not set — audit email gate captures emails but ghosts the buyer (no nurture)",
    });
  } else {
    try {
      const { Resend } = await import("resend");
      const r = new Resend(process.env.RESEND_API_KEY);
      const domains = await r.domains.list();
      if (domains.error) throw new Error(JSON.stringify(domains.error));
      const verifiedDomains = (domains.data?.data ?? []).filter((d) => d.status === "verified");
      const from = process.env.RESEND_FROM ?? "(default: onboarding@resend.dev)";
      results.push({
        name: "Resend",
        status: verifiedDomains.length === 0 ? "warn" : "ok",
        detail:
          verifiedDomains.length === 0
            ? `auth OK but 0 verified domains — from=${from} will land in Gmail Promotions`
            : `${verifiedDomains.length} verified domain(s) · from=${from}`,
      });
    } catch (e) {
      results.push({ name: "Resend", status: "fail", detail: msg(e) });
    }
  }

  // ── 4. Lemon Squeezy
  if (!process.env.LEMONSQUEEZY_API_KEY) {
    results.push({
      name: "Lemon Squeezy",
      status: "warn",
      detail: "LEMONSQUEEZY_API_KEY not set — buy buttons disabled",
    });
  } else {
    try {
      const { lemonSqueezySetup, getAuthenticatedUser, listProducts, listWebhooks } = await import(
        "@lemonsqueezy/lemonsqueezy.js"
      );
      lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY });
      const me = await getAuthenticatedUser();
      if (me.error) throw new Error(JSON.stringify(me.error));
      const storeId = process.env.LEMONSQUEEZY_STORE_ID;
      let productSummary = "";
      let webhookSummary = "";
      if (storeId) {
        const p = await listProducts({ filter: { storeId: Number(storeId) } });
        const pn = p.data?.data?.length ?? 0;
        productSummary = ` · ${pn} product${pn === 1 ? "" : "s"}`;
        const w = await listWebhooks({ filter: { storeId: Number(storeId) } });
        const wn = w.data?.data?.length ?? 0;
        webhookSummary = ` · ${wn} webhook${wn === 1 ? "" : "s"}`;
      }
      // Prisma's nullable-JSON filter is finicky; count linked themes in JS.
      const allThemes = await getPrisma().theme.findMany({ select: { lsVariants: true } });
      const totalThemes = allThemes.length;
      const linkedThemes = allThemes.filter((t) => t.lsVariants !== null).length;
      results.push({
        name: "Lemon Squeezy",
        status: linkedThemes === totalThemes && totalThemes > 0 ? "ok" : "warn",
        detail: `auth OK${productSummary}${webhookSummary} · ${linkedThemes}/${totalThemes} themes linked to variants`,
      });
    } catch (e) {
      results.push({ name: "Lemon Squeezy", status: "fail", detail: msg(e) });
    }
  }

  // ── 5. Cron + Neon Auth
  results.push({
    name: "Cron",
    status: process.env.CRON_SECRET ? "ok" : "warn",
    detail: process.env.CRON_SECRET
      ? "CRON_SECRET set — Vercel Cron will fire /api/cron/audit-nurture every 15 min"
      : "CRON_SECRET not set — nurture cadence (day 3 + day 7) won't fire",
  });
  results.push({
    name: "Neon Auth",
    status: process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET ? "ok" : "warn",
    detail:
      process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET
        ? "configured — /account/downloads + /auth/* work"
        : "NEON_AUTH_BASE_URL / NEON_AUTH_COOKIE_SECRET not set — /account/* 500s. First-purchase downloads from /buy/success still work.",
  });

  // ── 6. Public site URL sanity
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "(unset)";
  const isLocal = /localhost|127\.|0\.0\.0\.0/.test(siteUrl);
  results.push({
    name: "Site URL",
    status: isLocal ? "warn" : "ok",
    detail: `${siteUrl}${isLocal ? " — fine for dev; LS webhooks need a public URL" : ""}`,
  });

  // ── Print summary
  const ICON: Record<Result["status"], string> = { ok: "✓", warn: "⚠", fail: "✗" };
  console.log("");
  for (const r of results) {
    console.log(`  ${ICON[r.status]}  ${r.name.padEnd(16)} ${r.detail}`);
  }
  console.log("");
  const fails = results.filter((r) => r.status === "fail").length;
  const warns = results.filter((r) => r.status === "warn").length;
  const oks = results.filter((r) => r.status === "ok").length;
  console.log(`  ${oks} ok · ${warns} warn · ${fails} fail`);
  console.log("");

  if (fails > 0) process.exit(1);
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
