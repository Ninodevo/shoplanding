"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { fetchPageForAudit, FetchError } from "@/lib/audit/fetch";
import { extractPage } from "@/lib/audit/extract";
import { runRules } from "@/lib/audit/rules";
import { llmScoreUnknowns } from "@/lib/audit/llm";
import { scoreAudit, type AuditResult } from "@/lib/audit/score";

export type RunAuditOutcome =
  | { ok: true; auditId: string }
  | { ok: false; error: string };

/**
 * Server action invoked by the `/audit` form. Fetches the URL, extracts page
 * data, scores it, persists, and either returns the ID (for direct callers)
 * or redirects to `/audit/[id]` when called from a `<form action>`.
 *
 * Light rate-limit: hash the requester IP and bail if it has > 5 audits in
 * the last 15 minutes. Cheap protection against scraping the tool.
 */
export async function runAudit(formData: FormData): Promise<RunAuditOutcome> {
  const raw = String(formData.get("url") ?? "").trim();
  if (!raw) {
    return { ok: false, error: "Paste a product page URL first." };
  }

  // Normalize: add https:// if user pasted a bare domain
  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  const prisma = getPrisma();
  const ipHash = await hashClientIp();

  if (ipHash) {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60_000);
    const recent = await prisma.audit.count({
      where: { ipHash, createdAt: { gte: fifteenMinAgo } },
    });
    if (recent >= 5) {
      return {
        ok: false,
        error: "Too many audits from your IP. Wait 15 minutes and try again.",
      };
    }
  }

  let result: AuditResult;
  try {
    const fetched = await fetchPageForAudit(normalized);
    const extracted = extractPage({
      html: fetched.html,
      url: normalized,
      finalUrl: fetched.finalUrl,
    });

    // Two-stage scoring: heuristics first, LLM pass for the unknowns.
    // The LLM step is a no-op when ANTHROPIC_API_KEY isn't set, so dev
    // and CI keep running without a key. The action stays under ~5s on
    // typical pages — fetch + extract dominate; the LLM call adds ~1s.
    const heuristicRules = runRules(extracted);
    const augmentedRules = await llmScoreUnknowns(extracted, heuristicRules);
    result = scoreAudit({
      url: normalized,
      finalUrl: fetched.finalUrl,
      page: extracted,
      rules: augmentedRules,
    });
  } catch (err) {
    if (err instanceof FetchError) {
      return { ok: false, error: err.message };
    }
    console.error("[audit] unexpected error", err);
    return {
      ok: false,
      error: "Something went wrong while auditing. Try again in a minute.",
    };
  }

  const audit = await prisma.audit.create({
    data: {
      url: normalized,
      score: result.overallScore,
      rawResult: result as unknown as object,
      ipHash,
      source: "free",
    },
    select: { id: true },
  });

  return { ok: true, auditId: audit.id };
}

/**
 * Form-action variant — redirects to the result page on success, throws
 * to the closest error boundary on failure. Used by the public form.
 */
export async function runAuditAndRedirect(formData: FormData): Promise<void> {
  const r = await runAudit(formData);
  if (!r.ok) {
    // Encode the error into the redirect so the form can show it.
    redirect(`/audit?error=${encodeURIComponent(r.error)}`);
  }
  redirect(`/audit/${r.auditId}`);
}

async function hashClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    const ip = xff?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    if (!ip) return null;
    return createHash("sha256").update(ip).digest("hex");
  } catch {
    return null;
  }
}
