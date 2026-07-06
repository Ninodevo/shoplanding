/**
 * Export the generated WooCommerce plugin to a directory so it can be
 * mounted into a local WordPress (wp-env / WordPress Playground) for
 * rendered validation.
 *
 * Run: npx tsx scripts/export-woo-plugin.ts <preset-slug> <out-dir>
 * The plugin lands at <out-dir>/shoplanding-landing/.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import JSZip from "jszip";
import { getPrisma } from "../src/lib/db";
import { packageWoo } from "../src/lib/packagers/woo";
import type { LandingContent, LandingTokens } from "../src/components/landing/types";

async function main() {
  const slug = process.argv[2] ?? "skincare";
  const outDir = process.argv[3];
  if (!outDir) {
    console.error("Usage: npx tsx scripts/export-woo-plugin.ts <preset-slug> <out-dir>");
    process.exit(1);
  }

  const prisma = getPrisma();
  const preset = await prisma.layoutPreset.findUnique({ where: { slug } });
  if (!preset) {
    console.error(`Preset '${slug}' not found`);
    process.exit(1);
  }

  const out = await packageWoo({
    presetSlug: preset.slug,
    content: preset.demoSeed as unknown as LandingContent,
    tokens: preset.tokens as unknown as LandingTokens,
    version: "1.1.0",
    licenseKey: "DEV-EXPORT",
  });

  const zip = await JSZip.loadAsync(out.bytes);
  let count = 0;
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir || !name.startsWith("shoplanding-landing/")) continue;
    const target = join(outDir, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, await entry.async("nodebuffer"));
    count++;
  }
  console.log(`Exported ${count} plugin files to ${outDir}/shoplanding-landing`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
