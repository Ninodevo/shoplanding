/**
 * Run a full audit (heuristics + LLM pass) against any URL and print every
 * verdict. No DB write, no email — pure accuracy testing.
 *
 * Usage: npx tsx scripts/run-audit.ts <product-url> [--no-llm]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { fetchPageForAudit } from "../src/lib/audit/fetch";
import { extractPage } from "../src/lib/audit/extract";
import { runRules } from "../src/lib/audit/rules";
import { llmScoreUnknowns } from "../src/lib/audit/llm";
import { scoreAudit } from "../src/lib/audit/score";

async function main() {
  const url = process.argv[2];
  const noLlm = process.argv.includes("--no-llm");
  if (!url) {
    console.error("Usage: npx tsx scripts/run-audit.ts <product-url> [--no-llm]");
    process.exit(1);
  }

  const t0 = Date.now();
  const fetched = await fetchPageForAudit(url);
  const page = extractPage({ html: fetched.html, url, finalUrl: fetched.finalUrl });

  console.log("── extracted signals ─────────────────────────────");
  const { bodyTextSnippet: _snip, textIncludes, buttonText, h1Text, ...rest } = page;
  console.log(JSON.stringify({ ...rest, h1Text, buttonText: buttonText.slice(0, 10) }, null, 1));
  console.log("textIncludes:", Object.entries(textIncludes).filter(([, v]) => v).map(([k]) => k).join(", "));

  let rules = runRules(page);
  const h = tally(rules);
  console.log(`\nheuristics: ${h.pass} pass · ${h.fail} fail · ${h.unknown} unknown`);

  if (!noLlm) {
    const t1 = Date.now();
    rules = await llmScoreUnknowns(page, rules);
    const a = tally(rules);
    console.log(
      `LLM pass (${((Date.now() - t1) / 1000).toFixed(1)}s): ${a.pass} pass · ${a.fail} fail · ${a.unknown} manual`,
    );
  }

  const result = scoreAudit({ url, finalUrl: fetched.finalUrl, page, rules });
  console.log(`score: ${result.overallScore}/100 · total ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  console.log("── verdicts ──────────────────────────────────────");
  for (const r of rules) {
    console.log(
      `${r.status.padEnd(7)} ${r.aiAssisted ? "AI" : "  "} ${r.blockSlug}/${r.ruleIndex} · ${r.text.slice(0, 90)}` +
        (r.note ? `\n        ↳ ${r.note.slice(0, 200)}` : ""),
    );
  }
}

function tally(rules: Array<{ status: string }>) {
  return {
    pass: rules.filter((r) => r.status === "pass").length,
    fail: rules.filter((r) => r.status === "fail").length,
    unknown: rules.filter((r) => r.status === "unknown").length,
  };
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
