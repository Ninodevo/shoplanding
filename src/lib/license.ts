import { randomBytes } from "node:crypto";

/**
 * Issue a buyer-facing license key. Format: `SHOP-XXXX-XXXX-XXXX-XXXX`,
 * uppercase hex. Sortable by purchase order via the embedded random part is
 * intentionally false — keys are unguessable and pure-random by design.
 *
 * Stored on `Order.licenseKey` (unique). The Shopify and Woo zips read it at
 * install time to validate the install (Phase 7).
 */
export function generateLicenseKey(): string {
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `SHOP-${part()}-${part()}-${part()}-${part()}`;
}

/**
 * Generate a URL-safe random slug for the post-purchase preview at
 * `/preview/[slug]`. 9 random bytes → 12 url-safe chars; collision probability
 * is negligible at any reasonable order volume.
 */
export function generatePreviewSlug(): string {
  return randomBytes(9).toString("base64url");
}
