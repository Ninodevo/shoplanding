/**
 * Debug helper: print every rule verdict from a persisted audit.
 * Usage: npx tsx scripts/dump-audit.ts [auditId]  (defaults to most recent)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { getPrisma } from "../src/lib/db";

async function main() {
  const prisma = getPrisma();
  const deep = process.argv.includes("--deep");
  const id = process.argv.filter((a) => !a.startsWith("--"))[2];
  const audit = id
    ? await prisma.audit.findUnique({ where: { id } })
    : await prisma.audit.findFirst({ orderBy: { createdAt: "desc" } });
  if (!audit) throw new Error("no audit found");
  const r = (deep ? audit.deepResult : audit.rawResult) as Record<string, unknown> & {
    rules?: Array<Record<string, unknown>>;
  };
  if (!r) throw new Error(deep ? "no deepResult on this audit" : "no rawResult");
  console.log(`id ${audit.id} · score ${audit.score} · ${audit.url}\n`);
  for (const rule of r.rules ?? []) {
    const line = [
      String(rule.status ?? "?").padEnd(7),
      rule.aiAssisted ? "AI" : "  ",
      `${rule.blockSlug}/${rule.ruleIndex}`,
      "·",
      String(rule.text ?? "").slice(0, 90),
    ].join(" ");
    console.log(line + (rule.note ? `\n        ↳ ${String(rule.note).slice(0, 200)}` : ""));
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
