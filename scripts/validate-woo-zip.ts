/**
 * Validate the generated WooCommerce plugin zip: extract it, run `php -l`
 * (the real PHP linter) over every .php file, parse content.json, and check
 * the seeded content actually landed. Catches what WordPress would choke on
 * at activation time.
 *
 * Run: npx tsx scripts/validate-woo-zip.ts [preset-slug]
 * Requires a local `php` binary (brew install php).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import JSZip from "jszip";
import { getPrisma } from "../src/lib/db";
import { packageWoo } from "../src/lib/packagers/woo";
import type { LandingContent, LandingTokens } from "../src/components/landing/types";

async function main() {
  const slug = process.argv[2] ?? "skincare";
  const prisma = getPrisma();
  const preset = await prisma.layoutPreset.findUnique({ where: { slug } });
  if (!preset) {
    console.error(`Preset '${slug}' not found`);
    process.exit(1);
  }
  const content = preset.demoSeed as unknown as LandingContent;

  console.log(`→ Packaging WooCommerce plugin for preset '${slug}' …`);
  const out = await packageWoo({
    presetSlug: preset.slug,
    content,
    tokens: preset.tokens as unknown as LandingTokens,
    version: "1.1.0",
    licenseKey: "TEST-VALIDATE",
  });
  console.log(`  ${out.filename} · ${(out.bytes.byteLength / 1024).toFixed(0)} KB`);

  const zip = await JSZip.loadAsync(out.bytes);
  const files = Object.keys(zip.files).filter((f) => !zip.files[f].dir);
  console.log(`  ${files.length} files in zip`);

  let errors = 0;

  // Extract to a temp dir for php -l.
  const tmp = mkdtempSync(join(tmpdir(), "sl-woo-"));
  try {
    for (const name of files) {
      const target = join(tmp, name);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, await zip.files[name].async("nodebuffer"));
    }

    // 1. php -l every PHP file.
    const phpFiles = files.filter((f) => f.endsWith(".php"));
    for (const name of phpFiles) {
      try {
        execFileSync("php", ["-l", join(tmp, name)], { stdio: "pipe" });
        console.log(`  ✓ php -l ${name}`);
      } catch (e) {
        const msg = e instanceof Error && "stdout" in e ? String((e as { stdout: Buffer }).stdout) : String(e);
        console.error(`  ✗ php -l ${name}:\n${msg}`);
        errors++;
      }
    }

    // 2. No placeholder markers anywhere.
    for (const name of files) {
      if (name.endsWith(".zip")) continue;
      const text = await zip.files[name].async("string");
      if (/placeholder while the real|INSTALL-LATER|this file is a stub/i.test(text)) {
        console.error(`  ✗ ${name}: placeholder marker still present`);
        errors++;
      }
    }

    // 3. content.json parses + seeded content landed.
    const cjRaw = await zip.files["shoplanding-landing/includes/content.json"].async("string");
    const cj = JSON.parse(cjRaw);
    const checks: Array<[string, number, number]> = [
      ["reviews", cj.reviews.items.length, Math.min(content.reviews.length, 12)],
      ["faq", cj.faq.length, Math.min(content.faq.length, 12)],
      ["press", cj.press.length, Math.min(content.press.length, 8)],
      ["benefits", cj.benefits.length, Math.min(content.benefits.length, 6)],
      ["specs", cj.specs.length, Math.min(content.specs.length, 12)],
      ["comparison", cj.comparison.rows.length, Math.min(content.comparison.length, 10)],
      ["ingredients", cj.ingredients.length, Math.min(content.ingredients.length, 8)],
      ["social", cj.social.length, Math.min(content.socialReviews.length, 8)],
    ];
    for (const [sec, got, want] of checks) {
      if (got !== want) {
        console.error(`  ✗ content.json ${sec}: ${got} items, expected ${want}`);
        errors++;
      } else {
        console.log(`  ✓ ${sec}: ${got} seeded item(s)`);
      }
    }
    if (cj.brand.founder_quote !== content.brand.founderQuote) {
      console.error(`  ✗ founder quote not seeded`);
      errors++;
    } else {
      console.log(`  ✓ founder: quote seeded`);
    }

    // 4. Every render function referenced by the template exists in render.php.
    const template = await zip.files["shoplanding-landing/templates/landing-page.php"].async("string");
    const render = await zip.files["shoplanding-landing/includes/render.php"].async("string");
    const called = [...template.matchAll(/sl_render_[a-z_]+/g)].map((m) => m[0]);
    for (const fn of new Set(called)) {
      if (!render.includes(`function ${fn}(`)) {
        console.error(`  ✗ template calls ${fn}() but render.php doesn't define it`);
        errors++;
      }
    }
    console.log(`  ✓ ${new Set(called).size} render functions all defined`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  console.log(errors === 0 ? `\nPASS — plugin zip is structurally valid.` : `\nFAIL — ${errors} error(s).`);
  process.exit(errors === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
