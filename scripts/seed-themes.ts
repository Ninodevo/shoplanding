import "dotenv/config";
import { config } from "dotenv";
import { getPrisma } from "../src/lib/db";

config({ path: ".env.local" });

/**
 * Seed sellable `Theme` rows — one per `LayoutPreset`. Pricing matches the
 * Phase-1 model A: $99 single store / $249 unlimited / +$199 done-for-you.
 *
 * Idempotent. Re-run after editing this file or after `seed:presets` to keep
 * presetId references in sync.
 */

type ThemeSeed = {
  slug: string;
  presetSlug: string;
  name: string;
  tagline: string;
  version: string;
  changelog: string;
  /** Public screenshot URLs. Empty for now — populate when shoots happen. */
  screenshots: string[];
};

const THEMES: ThemeSeed[] = [
  {
    slug: "skincare-orelle",
    presetSlug: "skincare",
    name: "Orelle · Skincare",
    tagline: "Cream paper, sage accent. For solid lotions, balms, and oils.",
    version: "1.0.0",
    changelog: "Initial release.",
    screenshots: [],
  },
  {
    slug: "supplement-vitalstack",
    presetSlug: "supplement",
    name: "VitalStack · Supplement",
    tagline: "Dark-mode default, neon-green CTAs. For greens, daily stacks, and clinical doses.",
    version: "1.0.0",
    changelog: "Initial release.",
    screenshots: [],
  },
  {
    slug: "gadget-aurabud",
    presetSlug: "gadget",
    name: "Aurabud · Gadget",
    tagline: "Steel-grey, electric-blue. For single-SKU electronics with spec tables.",
    version: "1.0.0",
    changelog: "Initial release.",
    screenshots: [],
  },
];

async function main() {
  const prisma = getPrisma();

  const presets = await prisma.layoutPreset.findMany({
    select: { id: true, slug: true },
  });
  const presetIdBySlug = new Map(presets.map((p) => [p.slug, p.id]));
  if (presets.length === 0) {
    throw new Error(
      "No `LayoutPreset` rows. Run `npm run seed:presets` before this script.",
    );
  }

  for (const seed of THEMES) {
    const presetId = presetIdBySlug.get(seed.presetSlug);
    if (!presetId) {
      throw new Error(
        `Theme '${seed.slug}' references unknown preset '${seed.presetSlug}'.`,
      );
    }
    const data = {
      slug: seed.slug,
      presetId,
      name: seed.name,
      tagline: seed.tagline,
      version: seed.version,
      changelog: seed.changelog,
      priceSingleCents: 9900,
      priceUnlimitedCents: 24900,
      setupAddOnCents: 19900,
      screenshots: seed.screenshots as unknown as object,
      published: true,
    };
    await prisma.theme.upsert({
      where: { slug: seed.slug },
      update: data,
      create: data,
    });
    console.log(`  · ${seed.slug.padEnd(28)} → preset ${seed.presetSlug}`);
  }

  const total = await prisma.theme.count();
  console.log(`Seeded ${THEMES.length} themes. DB now has ${total} theme rows.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
