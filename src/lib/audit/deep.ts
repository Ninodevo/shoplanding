import { getPrisma } from "@/lib/db";
import { fetchRenderedPage } from "./rendered";
import { extractPage } from "./extract";
import { runRules } from "./rules";
import { llmScoreUnknowns } from "./llm";
import { scoreAudit, type AuditResult } from "./score";
import { recommendThemeFor } from "@/lib/audit/niche";
import { sendEmail } from "@/lib/email";
import { deepAuditReadyEmail } from "@/lib/email/templates";

/**
 * The paid deep audit: re-run the whole pipeline against the RENDERED DOM
 * instead of static HTML. Review-widget stars, JS galleries, variant
 * pickers, sticky bars — everything hydration adds — flows through the
 * same extract → rules → LLM pass, so 'manual' verdicts resolve into real
 * pass/fails. Persists to Audit.deepResult and emails the buyer.
 *
 * Runs async after the Lemon Squeezy webhook (via next/server `after`) or
 * from scripts/test-deep-audit.ts. Errors land in Audit.deepError so the
 * report page can show a retry state instead of hanging on "running".
 */
export type DeepAuditResult = AuditResult & {
  deep: true;
  /** Full-page JPEG, base64 (no data: prefix). */
  screenshot: string;
};

export async function runDeepAudit(auditId: string): Promise<void> {
  const prisma = getPrisma();
  const audit = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error(`deep audit: no audit ${auditId}`);
  if (audit.deepCompletedAt) return; // idempotent — already done

  await prisma.audit.update({
    where: { id: auditId },
    data: { deepStartedAt: new Date(), deepError: null },
  });

  try {
    const rendered = await fetchRenderedPage(audit.url);
    const page = extractPage({
      html: rendered.html,
      url: audit.url,
      finalUrl: rendered.finalUrl,
      rendered: true,
      probes: rendered.probes,
    });
    const heuristic = runRules(page);
    const rules = await llmScoreUnknowns(page, heuristic);
    const result = scoreAudit({
      url: audit.url,
      finalUrl: rendered.finalUrl,
      page,
      rules,
    });

    const deepResult: DeepAuditResult = {
      ...result,
      deep: true,
      screenshot: rendered.screenshotBase64,
    };

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        deepResult: JSON.parse(JSON.stringify(deepResult)),
        deepCompletedAt: new Date(),
        // The deep score is the authoritative one once it exists.
        score: result.overallScore,
      },
    });

    if (audit.email) {
      const tpl = deepAuditReadyEmail({
        email: audit.email,
        auditId: audit.id,
        url: audit.url,
        hostname: safeHost(audit.url),
        score: result.overallScore,
        result,
        recommendation: recommendThemeFor({ url: audit.url, result }),
      });
      await sendEmail({
        to: audit.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tag: "deep-audit-ready",
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[deep-audit] ${auditId} failed:`, err);
    await prisma.audit.update({
      where: { id: auditId },
      data: { deepError: message.slice(0, 500) },
    });
    throw err;
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
