import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  nurtureDay3Email,
  nurtureDay7Email,
  type AuditEmailContext,
} from "@/lib/email/templates";
import { recommendThemeFor } from "@/lib/audit/niche";
import type { AuditResult } from "@/lib/audit/score";

/**
 * Cron endpoint that fires the day-3 and day-7 nurture emails to every
 * audit unlocked in that window. Designed to be called every 15 minutes
 * (Vercel Cron, GitHub Actions, or curl) with a `CRON_SECRET` header.
 *
 * Idempotency: we only consider rows where the relevant `nurture*SentAt`
 * column is null. As soon as we send, we stamp the column — so re-running
 * the same minute can't double-send.
 *
 * Concurrency: this isn't worker-grade. If two cron runs overlap we could
 * race on the stamp. The `unlocked >= ?` window is wide enough (hours)
 * that occasional duplicates are tolerable. If that becomes a real
 * problem, swap to a SELECT … FOR UPDATE SKIP LOCKED transaction.
 */

export const dynamic = "force-dynamic";

// Cap how many rows we process per run to keep latency bounded. The page
// expects ≤ a few hundred unlocks per cron tick at any plausible scale.
const BATCH_LIMIT = 100;

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  // Auth: header preferred (Vercel Cron sets `Authorization: Bearer …`) but
  // accept query token as a fallback for curl-based testing.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not set" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") || "";
  const queryToken = req.nextUrl.searchParams.get("token");
  const ok =
    auth === `Bearer ${secret}` ||
    queryToken === secret;
  if (!ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const now = new Date();
  const day3Threshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const day7Threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Day 3: unlocked ≥ 3 days ago, day3 not yet sent
  const day3Due = await prisma.audit.findMany({
    where: {
      email: { not: null },
      unlockedAt: { not: null, lte: day3Threshold },
      nurtureDay3SentAt: null,
    },
    orderBy: { unlockedAt: "asc" },
    take: BATCH_LIMIT,
  });

  // ── Day 7: unlocked ≥ 7 days ago, day7 not yet sent (day3 may or may not have sent — if not, send day7 anyway, the cadence shouldn't block on a missed step)
  const day7Due = await prisma.audit.findMany({
    where: {
      email: { not: null },
      unlockedAt: { not: null, lte: day7Threshold },
      nurtureDay7SentAt: null,
    },
    orderBy: { unlockedAt: "asc" },
    take: BATCH_LIMIT,
  });

  let day3Sent = 0;
  let day3Failed = 0;
  for (const audit of day3Due) {
    const ctx = buildCtx(audit);
    if (!ctx) continue;
    const tpl = nurtureDay3Email(ctx);
    const send = await sendEmail({
      to: ctx.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "audit-nurture-day3",
    });
    if (send.ok) {
      await prisma.audit.update({
        where: { id: audit.id },
        data: { nurtureDay3SentAt: now },
      });
      day3Sent++;
    } else {
      day3Failed++;
    }
  }

  let day7Sent = 0;
  let day7Failed = 0;
  for (const audit of day7Due) {
    const ctx = buildCtx(audit);
    if (!ctx) continue;
    const tpl = nurtureDay7Email(ctx);
    const send = await sendEmail({
      to: ctx.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "audit-nurture-day7",
    });
    if (send.ok) {
      await prisma.audit.update({
        where: { id: audit.id },
        data: { nurtureDay7SentAt: now },
      });
      day7Sent++;
    } else {
      day7Failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    day3: { considered: day3Due.length, sent: day3Sent, failed: day3Failed },
    day7: { considered: day7Due.length, sent: day7Sent, failed: day7Failed },
  });
}

type AuditRow = {
  id: string;
  url: string;
  email: string | null;
  score: number;
  rawResult: unknown;
};

function buildCtx(audit: AuditRow): AuditEmailContext | null {
  if (!audit.email) return null;
  const result = audit.rawResult as AuditResult;
  if (!result || typeof result !== "object") return null;
  return {
    email: audit.email,
    auditId: audit.id,
    url: audit.url,
    hostname: safeHost(audit.url),
    score: audit.score,
    result,
    recommendation: recommendThemeFor({ url: audit.url, result }),
  };
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
