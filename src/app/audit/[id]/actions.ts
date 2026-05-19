"use server";

import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";

/**
 * Email-gate unlock for a stored audit. The score and per-block summary are
 * public; the top-fixes list and per-rule breakdown are gated behind this
 * form. Once unlocked, the audit is unlocked for *every* viewer of the URL —
 * we just need the first auditor's email for the marketing flywheel. Sharing
 * a 69-rule breakdown is a feature, not a leak.
 *
 * Security posture: trivial email validation, then a single UPDATE. We don't
 * verify the email (no double-opt-in yet) — that's deliberate v1.1 simplicity.
 * If garbage comes in, the report still unlocks; we just have a noisy list.
 * v1.2 adds Resend confirm-link.
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
  await prisma.audit.update({
    where: { id },
    data: { email: rawEmail },
  });

  // Anchor jumps the reader straight to the now-unlocked top fixes section.
  redirect(`/audit/${id}#top-fixes`);
}
