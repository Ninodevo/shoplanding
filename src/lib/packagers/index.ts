import { getPrisma } from "@/lib/db";
import type {
  LandingContent,
  LandingTokens,
  LandingTweaks,
} from "@/components/landing/types";
import { packageSpec } from "./spec";
import { packageShopify } from "./shopify";
import { packageWoo } from "./woo";
import type { ArtifactKind, PackagerInput, PackagerOutput } from "./types";

export {
  ARTIFACT_KINDS,
  DELIVERABLE_ARTIFACT_KINDS,
  ARTIFACT_LABEL,
  ARTIFACT_FILENAME,
  type ArtifactKind,
  type PackagerInput,
  type PackagerOutput,
} from "./types";

const REGISTRY: Record<
  ArtifactKind,
  (input: PackagerInput) => Promise<PackagerOutput>
> = {
  spec: packageSpec,
  shopify: packageShopify,
  woo: packageWoo,
};

/**
 * One-stop packager. Looks up the preset + theme by slug, merges optional
 * buyer tweaks, dispatches to the right format-specific builder.
 *
 * Throws when the preset slug is unknown — callers should 404 on that.
 */
export async function packageThemeArtifact(args: {
  presetSlug: string;
  kind: ArtifactKind;
  tweaks?: LandingTweaks;
  /** Bake into LICENSE.txt for traceability. */
  licenseKey?: string;
  /** Override theme version; otherwise we read from the Theme row. */
  version?: string;
}): Promise<PackagerOutput> {
  const prisma = getPrisma();
  const preset = await prisma.layoutPreset.findUnique({
    where: { slug: args.presetSlug },
    include: {
      themes: {
        select: { version: true, slug: true },
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!preset) {
    throw new Error(`Unknown preset slug: ${args.presetSlug}`);
  }

  const input: PackagerInput = {
    presetSlug: preset.slug,
    tokens: preset.tokens as unknown as LandingTokens,
    content: preset.demoSeed as unknown as LandingContent,
    tweaks: args.tweaks,
    version: args.version ?? preset.themes[0]?.version ?? "1.0.0",
    licenseKey: args.licenseKey,
  };

  return REGISTRY[args.kind](input);
}
