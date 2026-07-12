/**
 * Run the paid deep-audit pipeline locally against an existing audit —
 * exactly what the webhook kicks off, minus the payment. Needs local
 * Playwright (`npx playwright install chromium`) or BROWSER_WS_URL.
 *
 * Usage: npx tsx scripts/test-deep-audit.ts [auditId]   (default: latest)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { getPrisma } from "../src/lib/db";
import { runDeepAudit } from "../src/lib/audit/deep";

async function main() {
  const prisma = getPrisma();
  const id =
    process.argv[2] ??
    (await prisma.audit.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true } }))?.id;
  if (!id) throw new Error("no audit to deep-run");

  // Testing convenience: wipe the completion watermark so runDeepAudit
  // re-runs (it overwrites deepResult itself on success).
  if (process.argv.includes("--force")) {
    await prisma.audit.update({
      where: { id },
      data: { deepCompletedAt: null, deepError: null },
    });
  }

  const before = await prisma.audit.findUnique({ where: { id } });
  console.log(`→ Deep audit for ${before?.url} (audit ${id}, static score ${before?.score}) …`);

  const t0 = Date.now();
  await runDeepAudit(id);

  const after = await prisma.audit.findUnique({ where: { id } });
  const deep = after?.deepResult as { rules?: Array<{ status: string; aiAssisted?: boolean }>; screenshot?: string } | null;
  const rules = deep?.rules ?? [];
  const t = (s: string) => rules.filter((r) => r.status === s).length;
  console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`  deep score: ${after?.score}/100 (was ${before?.score})`);
  console.log(`  verdicts: ${t("pass")} pass · ${t("fail")} fail · ${t("unknown")} manual`);
  console.log(`  screenshot: ${deep?.screenshot ? Math.round(deep.screenshot.length / 1024) + " KB base64" : "MISSING"}`);
  console.log(`  report: /audit/${id}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
