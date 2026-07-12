"use server";

import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { unlockEmail } from "@/lib/email/templates";
import { recommendThemeFor } from "@/lib/audit/niche";
import type { AuditResult } from "@/lib/audit/score";

/**
 * Email-gate unlock for a stored audit. The score and per-block summary are
 * public; the top-fixes list and per-rule breakdown are gated behind this
 * form. Once unlocked, the audit is unlocked for *every* viewer of the URL —
 * we just need the first auditor's email for the marketing flywheel. Sharing
 * a 69-rule breakdown is a feature, not a leak.
 *
 * After persisting the email we send the unlock email synchronously. The
 * latency add (~400ms with Resend) is below the redirect threshold a user
 * perceives, and doing it inline avoids needing a queue. If Resend isn't
 * configured or the call fails, we still complete the unlock — email is a
 * soft dependency.
 *
 * Day-3 + day-7 nurture emails are handled by the cron route
 * `/api/cron/audit-nurture`.
 */
export async function unlockAuditWithEmail(formData: FormData): Promise<void> {
  const id = String(formData.get("auditId") ?? "").trim();
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!id) {
    redirect("/audit");
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) && rawEmail.length <= 254;
  if (!emailOk) {
    redirect(`/audit/${id}?error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  const prisma = getPrisma();
  const now = new Date();

  // Persist the email + unlock timestamp first. If the email send fails we
  // still want the row marked unlocked so subsequent visits skip the gate.
  const audit = await prisma.audit.update({
    where: { id },
    data: {
      email: rawEmail,
      unlockedAt: now,
    },
  });

  // Fire the unlock email — soft-fail.
  try {
    const result = audit.rawResult as unknown as AuditResult;
    const hostname = safeHost(audit.url);
    const recommendation = recommendThemeFor({ url: audit.url, result });
    const tpl = unlockEmail({
      email: rawEmail,
      auditId: audit.id,
      url: audit.url,
      hostname,
      score: audit.score,
      result,
      recommendation,
    });
    const send = await sendEmail({
      to: rawEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tag: "audit-unlock",
    });
    if (send.ok) {
      await prisma.audit.update({
        where: { id },
        data: { unlockEmailSentAt: now },
      });
    }
  } catch (err) {
    console.warn("[unlock] email path failed (continuing)", err);
  }

  // Anchor jumps the reader straight to the now-unlocked top fixes section.
  redirect(`/audit/${id}#top-fixes`);
}

/**
 * Kick off Lemon Squeezy checkout for the deep audit. The webhook flips
 * `deepPaidAt` and starts the rendered-browser run; the success redirect
 * lands back on the report, which shows the "running" state until
 * `deepResult` exists.
 */
export async function startDeepAuditCheckout(formData: FormData): Promise<void> {
  const id = String(formData.get("auditId") ?? "").trim();
  if (!id) redirect("/audit");

  const prisma = getPrisma();
  const audit = await prisma.audit.findUnique({
    where: { id },
    select: { id: true, email: true, deepPaidAt: true },
  });
  if (!audit) redirect("/audit");
  if (audit.deepPaidAt) redirect(`/audit/${id}`); // already bought

  const { createDeepAuditCheckoutUrl, getSiteUrl } = await import("@/lib/lemonsqueezy");
  let checkoutUrl: string;
  try {
    checkoutUrl = await createDeepAuditCheckoutUrl({
      auditId: id,
      successUrl: `${getSiteUrl()}/audit/${id}?deep=pending`,
      prefilledEmail: audit.email ?? undefined,
    });
  } catch (err) {
    console.error("[deep-audit] checkout creation failed", err);
    redirect(
      `/audit/${id}?error=${encodeURIComponent("Checkout is unavailable right now — try again in a minute.")}`,
    );
  }
  redirect(checkoutUrl);
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
