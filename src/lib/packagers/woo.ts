import JSZip from "jszip";
import {
  ARTIFACT_FILENAME,
  type PackagerInput,
  type PackagerOutput,
} from "./types";
import { packageSpec } from "./spec";

/**
 * WooCommerce theme packager — placeholder.
 *
 * The real implementation produces a child theme of a clean parent (Storefront
 * or Blocksy) plus a small plugin that registers a "Single Product Landing"
 * page template. Parity work with the Shopify emitter; lands in its own PR.
 *
 * Same placeholder shape as Shopify — we ship a zip with the spec inside and
 * an explanatory README. The download URL contract is stable.
 */
export async function packageWoo(
  input: PackagerInput,
): Promise<PackagerOutput> {
  const spec = await packageSpec(input);
  const zip = new JSZip();

  zip.file("README.md", buildReadme(input));
  zip.file("INSTALL-LATER.md", buildInstallNote());
  zip.file(`spec/${spec.filename}`, spec.bytes);

  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    filename: ARTIFACT_FILENAME.woo(input.presetSlug),
    contentType: "application/zip",
    bytes,
  };
}

function buildReadme(input: PackagerInput): string {
  return [
    `# ShopLanding · WooCommerce theme — placeholder`,
    ``,
    `**Preset:** \`${input.presetSlug}\`  `,
    `**Version:** ${input.version}`,
    ``,
    `This zip is a placeholder while the real Woo child-theme emitter is`,
    `finishing. The system spec is bundled inside (\`spec/\`) so you can already`,
    `implement against it on any WordPress theme yourself.`,
    ``,
    `When the emitter ships, your account dashboard at \`/account/downloads\``,
    `surfaces the new artifact under the same order. Re-download anytime — the`,
    `URL structure doesn't change.`,
    ``,
    `Questions: support@shoplanding.com`,
    ``,
  ].join("\n");
}

function buildInstallNote(): string {
  return [
    `# How to install (when the real zip lands)`,
    ``,
    `1. Install the parent theme (Storefront or Blocksy — free).`,
    `2. Appearance → Themes → Add new → Upload theme.`,
    `3. Upload this .zip — it's a child theme + activation plugin.`,
    `4. Activate. The plugin registers a "Single Product Landing" page template.`,
    `5. Pages → Add new → choose the new template → assign your product.`,
    `6. Customize → palette, fonts, copy slots.`,
    ``,
    `Until then this file is a stub.`,
    ``,
  ].join("\n");
}
