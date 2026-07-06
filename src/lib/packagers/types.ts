import type {
  LandingContent,
  LandingTokens,
  LandingTweaks,
} from "@/components/landing/types";

/** All artifact kinds the packager layer knows how to build. */
export const ARTIFACT_KINDS = ["spec", "shopify", "woo"] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

/**
 * The kinds actually delivered to buyers today. All three are real as of
 * Phase 16: the Shopify theme (validated by Shopify Theme Check), the
 * WooCommerce landing plugin (php -l validated), and the portable spec.
 */
export const DELIVERABLE_ARTIFACT_KINDS = ["shopify", "woo", "spec"] as const;

export const ARTIFACT_LABEL: Record<ArtifactKind, string> = {
  spec: "Portable system spec",
  shopify: "Shopify theme zip",
  woo: "WooCommerce plugin zip",
};

export const ARTIFACT_FILENAME: Record<ArtifactKind, (slug: string) => string> = {
  spec: (slug) => `shoplanding-${slug}-spec.zip`,
  shopify: (slug) => `shoplanding-${slug}-shopify.zip`,
  woo: (slug) => `shoplanding-${slug}-woo.zip`,
};

export type PackagerInput = {
  /** Preset slug — also embedded in the artifact filenames. */
  presetSlug: string;
  /** The same tokens the renderer applies. Wrapper merges tweak overrides. */
  tokens: LandingTokens;
  /** Demo seed plus any buyer overrides. */
  content: LandingContent;
  /** Pre-purchase or buyer's customizations. May be missing pre-checkout. */
  tweaks?: LandingTweaks;
  /** Artifact version stamp (matches `Theme.version`). */
  version: string;
  /** Optional license key to bake into a `LICENSE.txt` for traceability. */
  licenseKey?: string;
};

export type PackagerOutput = {
  /** Suggested download filename. */
  filename: string;
  /** MIME type for the response. */
  contentType: string;
  /** Raw zip bytes. */
  bytes: Uint8Array;
};
