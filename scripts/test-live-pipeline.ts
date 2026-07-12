/**
 * Live pipeline test — run after ANTHROPIC_API_KEY + RESEND_API_KEY land.
 *
 * 1. Full audit with the Claude pass active (first real run): reports how
 *    many of the heuristically-unknown rules the LLM resolved.
 * 2. Persists the audit, then sends the REAL unlock email (same template +
 *    send path production uses) to the given address.
 *
 * Usage: npx tsx scripts/test-live-pipeline.ts <your-email> [product-url]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { getPrisma } from "../src/lib/db";
import { fetchPageForAudit } from "../src/lib/audit/fetch";
import { extractPage } from "../src/lib/audit/extract";
import { runRules } from "../src/lib/audit/rules";
import { llmScoreUnknowns } from "../src/lib/audit/llm";
import { scoreAudit } from "../src/lib/audit/score";
import { recommendThemeFor } from "../src/lib/audit/niche";
import { sendEmail } from "../src/lib/email";
import { unlockEmail } from "../src/lib/email/templates";

async function main() {
  const to = process.argv[2];
  const url = process.argv[3] ?? "https://www.drinkolipop.com/products/strawberry-vanilla";
  if (!to) {
    console.error("Usage: npx tsx scripts/test-live-pipeline.ts <your-email> [product-url]");
    process.exit(1);
  }

  // ── 1. Audit with LLM pass
  console.log(`→ Auditing ${url} (LLM pass ACTIVE) …`);
  const t0 = Date.now();
  const fetched = await fetchPageForAudit(url);
  const extracted = extractPage({ html: fetched.html, url, finalUrl: fetched.finalUrl });
  const heuristic = runRules(extracted);
  const hCounts = tally(heuristic);
  console.log(`  heuristics: ${hCounts.pass} pass · ${hCounts.fail} fail · ${hCounts.unknown} unknown`);

  const t1 = Date.now();
  const augmented = await llmScoreUnknowns(extracted, heuristic);
  const aCounts = tally(augmented);
  const aiTouched = augmented.filter((r) => r.aiAssisted).length;
  console.log(
    `  LLM pass (${((Date.now() - t1) / 1000).toFixed(1)}s): resolved ${aiTouched} of ${hCounts.unknown} unknowns → now ${aCounts.pass} pass · ${aCounts.fail} fail · ${aCounts.unknown} manual`,
  );

  const result = scoreAudit({ url, finalUrl: fetched.finalUrl, page: extracted, rules: augmented });
  console.log(`  score: ${result.overallScore}/100 · total ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const prisma = getPrisma();
  const audit = await prisma.audit.create({
    data: {
      url,
      email: to,
      rawResult: JSON.parse(JSON.stringify(result)),
      score: result.overallScore,
      source: "test",
      unlockedAt: new Date(),
    },
  });
  console.log(`  persisted: /audit/${audit.id}`);

  // ── 2. Unlock email via the production template + send path
  console.log(`→ Sending unlock email to ${to} …`);
  const tpl = unlockEmail({
    email: to,
    auditId: audit.id,
    url,
    hostname: new URL(url).hostname,
    score: result.overallScore,
    result,
    recommendation: recommendThemeFor({ url, result }),
  });
  const send = await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tag: "pipeline-test",
  });
  if (send.ok) {
    await prisma.audit.update({
      where: { id: audit.id },
      data: { unlockEmailSentAt: new Date() },
    });
    console.log(`  ✓ sent (resend id: ${send.id})`);
    console.log(`\nCheck ${to} — subject: "${tpl.subject}"`);
  } else {
    console.error(`  ✗ send failed: ${send.error}`);
    process.exit(1);
  }
}

function tally(rules: Array<{ status: string }>) {
  return {
    pass: rules.filter((r) => r.status === "pass").length,
    fail: rules.filter((r) => r.status === "fail").length,
    unknown: rules.filter((r) => r.status === "unknown").length,
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
