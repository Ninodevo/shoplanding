/**
 * Validate the generated Shopify theme zip the way Shopify's upload
 * validator would: every section's {% schema %} must be parseable JSON,
 * templates/*.json must parse, and no stub markers may remain. Also checks
 * that the seeded content actually landed in product.json.
 *
 * Run: npx tsx scripts/validate-shopify-zip.ts [preset-slug]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import JSZip from "jszip";
import { getPrisma } from "../src/lib/db";
import { packageShopify } from "../src/lib/packagers/shopify";
import type { LandingContent, LandingTokens } from "../src/components/landing/types";

async function main() {
  const slug = process.argv[2] ?? "skincare";
  const prisma = getPrisma();
  const preset = await prisma.layoutPreset.findUnique({ where: { slug } });
  if (!preset) {
    console.error(`Preset '${slug}' not found`);
    process.exit(1);
  }

  console.log(`→ Packaging Shopify theme for preset '${slug}' …`);
  const out = await packageShopify({
    presetSlug: preset.slug,
    content: preset.demoSeed as unknown as LandingContent,
    tokens: preset.tokens as unknown as LandingTokens,
    version: "1.1.0",
    licenseKey: "TEST-VALIDATE",
  });
  console.log(`  ${out.filename} · ${(out.bytes.byteLength / 1024).toFixed(0)} KB`);

  const zip = await JSZip.loadAsync(out.bytes);
  const files = Object.keys(zip.files).filter((f) => !zip.files[f].dir);
  console.log(`  ${files.length} files in zip`);

  let errors = 0;

  // 1. No stub markers anywhere.
  for (const name of files) {
    if (!name.endsWith(".liquid") && !name.endsWith(".md")) continue;
    const text = await zip.files[name].async("string");
    if (/v1 stub|sl-stub-section|placeholder while the real/i.test(text)) {
      console.error(`  ✗ ${name}: stub marker still present`);
      errors++;
    }
  }

  // 2. Every section schema parses as JSON.
  const sectionFiles = files.filter((f) => f.startsWith("sections/"));
  for (const name of sectionFiles) {
    const text = await zip.files[name].async("string");
    const m = text.match(/{% schema %}([\s\S]*?){% endschema %}/);
    if (!m) {
      console.error(`  ✗ ${name}: no {% schema %} block`);
      errors++;
      continue;
    }
    try {
      const schema = JSON.parse(m[1]!);
      if (!schema.name) throw new Error("schema.name missing");
    } catch (e) {
      console.error(`  ✗ ${name}: schema JSON invalid — ${e instanceof Error ? e.message : e}`);
      errors++;
    }
  }
  console.log(`  ✓ ${sectionFiles.length} section schemas checked`);

  // 3. Templates + config parse.
  for (const name of files.filter((f) => f.endsWith(".json"))) {
    try {
      JSON.parse(await zip.files[name].async("string"));
    } catch (e) {
      console.error(`  ✗ ${name}: invalid JSON — ${e instanceof Error ? e.message : e}`);
      errors++;
    }
  }

  // 4. Seeded content landed in product.json.
  const tpl = JSON.parse(await zip.files["templates/product.json"].async("string"));
  const content = preset.demoSeed as unknown as LandingContent;
  const checks: Array<[string, number, number]> = [
    ["reviews", Object.keys(tpl.sections.reviews.blocks ?? {}).length, Math.min(content.reviews.length, 12)],
    ["faq", Object.keys(tpl.sections.faq.blocks ?? {}).length, Math.min(content.faq.length, 12)],
    ["press", Object.keys(tpl.sections.press.blocks ?? {}).length, Math.min(content.press.length, 8)],
    ["benefits", Object.keys(tpl.sections.benefits.blocks ?? {}).length, Math.min(content.benefits.length, 6)],
    ["specs", Object.keys(tpl.sections.specs.blocks ?? {}).length, Math.min(content.specs.length, 12)],
    ["comparison", Object.keys(tpl.sections.comparison.blocks ?? {}).length, Math.min(content.comparison.length, 10)],
    ["ingredients", Object.keys(tpl.sections.ingredients.blocks ?? {}).length, Math.min(content.ingredients.length, 8)],
    ["ugc", Object.keys(tpl.sections.ugc.blocks ?? {}).length, Math.min(content.socialReviews.length, 8)],
    ["cross-sell", Object.keys(tpl.sections["cross-sell"].blocks ?? {}).length, Math.min(content.crossSells.length, 4)],
  ];
  for (const [sec, got, want] of checks) {
    if (got !== want) {
      console.error(`  ✗ product.json ${sec}: ${got} blocks, expected ${want}`);
      errors++;
    } else {
      console.log(`  ✓ ${sec}: ${got} seeded block(s)`);
    }
  }
  const founderQuote = tpl.sections.founder?.settings?.quote;
  if (!founderQuote || founderQuote !== content.brand.founderQuote) {
    console.error(`  ✗ founder quote not seeded`);
    errors++;
  } else {
    console.log(`  ✓ founder: quote seeded`);
  }

  console.log(errors === 0 ? `\nPASS — zip is structurally valid.` : `\nFAIL — ${errors} error(s).`);
  process.exit(errors === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
