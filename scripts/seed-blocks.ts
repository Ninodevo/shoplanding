import "dotenv/config";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { getPrisma } from "../src/lib/db";

config({ path: ".env.local" });

const FILE = resolve("handoff/project/uploads/checklist.xlsx");
const SHEET = "🛬  Landing page";

type Item = { text: string; row: number };
type Section = { name: string; emoji: string; items: Item[] };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * The 🛬 sheet alternates section header rows (col A = emoji, col B = title) with
 * item rows (col A = "True"/"False" or "TRUE"/"FALSE", col B = the requirement). We
 * walk top-to-bottom, group items under the most recent header, and emit one Block
 * per section.
 */
function parseSheet(): Section[] {
  const buf = readFileSync(FILE);
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[SHEET];
  if (!ws) {
    throw new Error(
      `Sheet '${SHEET}' not found. Available: ${wb.SheetNames.join(", ")}`,
    );
  }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  const sections: Section[] = [];
  let current: Section | null = null;

  rows.forEach((rawRow, idx) => {
    const rowNum = idx + 1;
    if (rowNum === 1) return;
    const a = rawRow[0] == null ? "" : String(rawRow[0]).trim();
    const b = rawRow[1] == null ? "" : String(rawRow[1]).trim();
    if (!b) return;

    const isBool = /^(true|false)$/i.test(a);
    if (!isBool && a.length > 0 && a.length <= 4) {
      current = { emoji: a, name: b, items: [] };
      sections.push(current);
      return;
    }
    if (current && isBool) {
      current.items.push({ text: b, row: rowNum });
    }
  });

  return sections.filter((s) => s.items.length > 0);
}

async function main() {
  const sections = parseSheet();
  console.log(`Parsed ${sections.length} sections from ${SHEET}.`);
  for (const s of sections) {
    console.log(`  ${s.emoji} ${s.name} — ${s.items.length} items`);
  }

  const prisma = getPrisma();
  let order = 0;
  for (const s of sections) {
    const slug = slugify(s.name);
    const data = {
      slug,
      name: s.name,
      category: "landing",
      sortOrder: order,
      purpose: `${s.emoji} ${s.name} — ${s.items.length} CRO requirements from the 🛬 Landing page checklist`,
      mustInclude: s.items.map((i) => i.text),
      pitfalls: [],
      checklistRefs: s.items.map((i) => i.row),
    } as const;
    await prisma.block.upsert({
      where: { slug },
      update: data,
      create: data,
    });
    order++;
  }
  const total = await prisma.block.count();
  console.log(`Seeded ${sections.length} blocks. Total in DB: ${total}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
