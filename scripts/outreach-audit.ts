/**
 * Outreach assembly line: batch-audit store URLs and draft the replies.
 *
 * For each product URL this runs the REAL audit pipeline (fetch → extract →
 * 69 rules → LLM pass when ANTHROPIC_API_KEY is set → score), persists the
 * audit row (source: "outreach") so a shareable /audit/<id> link exists,
 * and writes a per-store markdown file containing:
 *
 *   - the score + top findings phrased for humans
 *   - a ready-to-edit Reddit "review my store" reply (value-first)
 *   - a ready-to-edit cold-email draft
 *
 * Usage:
 *   npx tsx scripts/outreach-audit.ts <url> [url ...]
 *   npx tsx scripts/outreach-audit.ts --file stores.txt   # one URL per line
 *
 * Output lands in ./outreach/ (gitignored — it contains third-party store
 * data and your personal outreach drafts).
 *
 * IMPORTANT: these are DRAFTS. Rewrite at least one sentence in your own
 * voice before posting, and only reply where feedback was actually asked
 * for. Value-first is the whole strategy — a pasted template reads as spam
 * and burns the account.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getPrisma } from "../src/lib/db";
import { fetchPageForAudit } from "../src/lib/audit/fetch";
import { extractPage } from "../src/lib/audit/extract";
import { runRules } from "../src/lib/audit/rules";
import { llmScoreUnknowns } from "../src/lib/audit/llm";
import { scoreAudit } from "../src/lib/audit/score";

const OUT_DIR = "outreach";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

async function main() {
  const args = process.argv.slice(2);
  let urls: string[] = [];
  if (args[0] === "--file" && args[1]) {
    urls = readFileSync(args[1], "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  } else {
    urls = args;
  }
  if (urls.length === 0) {
    console.error("Usage: npx tsx scripts/outreach-audit.ts <url> [...] | --file stores.txt");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const prisma = getPrisma();
  const summary: string[] = [];

  for (const url of urls) {
    const host = safeHost(url);
    process.stdout.write(`→ ${host} … `);
    try {
      const fetched = await fetchPageForAudit(url);
      const extracted = extractPage({ html: fetched.html, url, finalUrl: fetched.finalUrl });
      const heuristic = runRules(extracted);
      const augmented = await llmScoreUnknowns(extracted, heuristic);
      const result = scoreAudit({ url, finalUrl: fetched.finalUrl, page: extracted, rules: augmented });

      const audit = await prisma.audit.create({
        data: {
          url,
          rawResult: JSON.parse(JSON.stringify(result)),
          score: result.overallScore,
          source: "outreach",
        },
      });

      const auditUrl = `${SITE_URL}/audit/${audit.id}`;
      const md = draftMarkdown({ url, host, auditUrl, result });
      const file = join(OUT_DIR, `${host.replace(/[^a-z0-9.-]/gi, "_")}.md`);
      writeFileSync(file, md);
      summary.push(`${result.overallScore}/100  ${host}  → ${file}`);
      console.log(`${result.overallScore}/100 → ${file}`);
      // Be polite to other people's servers.
      await sleep(1500);
    } catch (err) {
      console.log(`FAILED (${err instanceof Error ? err.message : err})`);
      summary.push(`FAILED   ${host}`);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  for (const line of summary) console.log(`  ${line}`);
}

type Ctx = {
  url: string;
  host: string;
  auditUrl: string;
  result: ReturnType<typeof scoreAudit>;
};

/**
 * Turn a rule failure into a problem-statement for the drafts. The rule
 * text says what SHOULD be true ("Gallery contains multiple product
 * photos"); the note says what's actually wrong ("Only 1 product image
 * detected") — lead with the problem, keep the rule as context.
 */
function humanize(f: { text: string; note?: string }): string {
  const rule = f.text.replace(/\s*\(.*?\)\s*/g, " ").trim().replace(/\.$/, "");
  // Lowercase the leading word only when it isn't an acronym (FAQ, CTA, BNPL…).
  const lc =
    /^[A-Z][a-z]/.test(rule) ? rule.charAt(0).toLowerCase() + rule.slice(1) : rule;
  if (f.note) {
    const problem = f.note.replace(/\.$/, "");
    return `${problem} — the playbook rule: ${lc}`;
  }
  return `Missing: ${lc}`;
}

function draftMarkdown(ctx: Ctx): string {
  const { host, auditUrl, result } = ctx;
  const fixes = result.topFixes.slice(0, 3);
  const fixLines = fixes.map((f, i) => `${i + 1}. **${humanize(f)}**`).join("\n");
  const passes = result.rules.filter((r) => r.status === "pass").length;

  // A genuine positive to open with — leads with respect, not criticism.
  const good =
    result.overallScore >= 70
      ? "honestly one of the better PDPs I've run through this"
      : result.overallScore >= 50
        ? `solid base — ${passes} of the checks pass already`
        : `there's real headroom here — ${passes} checks pass, but the big levers are missing`;

  return `# ${host} — ${result.overallScore}/100

Audited: ${new Date().toISOString().slice(0, 10)}
Shareable report: ${auditUrl}
Full URL: ${ctx.url}

## Top findings

${result.topFixes.map((f, i) => `${i + 1}. [w${f.weight}] ${f.text}${f.note ? ` — ${f.note}` : ""}`).join("\n")}

---

## Reddit reply draft (for "review my store" threads)

> Took a proper look at your product page — ${good}. Three things I'd fix first:
>
${fixLines.split("\n").map((l) => `> ${l}`).join("\n")}
>
> None of these are redesigns — they're each an afternoon of work, and they're the highest-weight items from the conversion checklist I use. I ran your page through a 69-rule checker I built if you want the full breakdown: ${auditUrl}

**Before posting:** rewrite the opening line in your own words, reference something SPECIFIC you saw on their page (product name, a claim they make), and only post where feedback was invited.

---

## Cold email draft

**Subject:** 3 conversion fixes for ${host} (took the liberty)

> Hey — I build conversion tooling for single-product stores and ran ${host} through my 69-rule product-page checker while researching the niche. It scored **${result.overallScore}/100**. The three highest-impact fixes:
>
${fixLines.split("\n").map((l) => `> ${l}`).join("\n")}
>
> Full rule-by-rule breakdown here (no signup): ${auditUrl}
>
> If any of it's useful, it's yours — no strings. And if you'd rather someone just implement the fixes, that's what I do.
>
> — Nino

**Before sending:** find the founder's actual name, mention their product by name, and cut anything that isn't true for their page.
`;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
