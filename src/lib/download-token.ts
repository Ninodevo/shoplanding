import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring download URLs.
 *
 * The order's `licenseKey` is the perfect signing material — unique per buyer,
 * never leaves the server, and lives as long as the order. We HMAC-SHA256 a
 * canonical (orderId · kind · expiresAt) tuple keyed by `licenseKey`. If
 * `licenseKey` rotates (refund + reissue), all old links die — by design.
 *
 * Format: `<base64url(payload)>.<base64url(sig)>`
 *   payload = `<orderId>:<kind>:<expiresAtMs>`
 */
export type DownloadKind = "spec" | "shopify" | "woo";

const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(s: string): Buffer {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

/** Mint a token a download URL can carry. Default TTL is 7 days. */
export function issueDownloadToken(args: {
  orderId: string;
  kind: DownloadKind;
  licenseKey: string;
  ttlMs?: number;
}): string {
  const expiresAt = Date.now() + (args.ttlMs ?? TTL_MS);
  const payload = `${args.orderId}:${args.kind}:${expiresAt}`;
  const sig = sign(payload, args.licenseKey);
  return `${b64url(Buffer.from(payload))}.${sig}`;
}

export type DecodedToken = {
  orderId: string;
  kind: DownloadKind;
  expiresAt: number;
};

/** Verify a token against the order's license key. Returns null on any failure. */
export function verifyDownloadToken(args: {
  token: string;
  licenseKey: string;
}): DecodedToken | null {
  const parts = args.token.split(".");
  // Reject extra-dot tokens like `payload.sig.tampered` — `split` would
  // otherwise silently drop the trailing junk and the front half would still
  // verify. We require exactly one separator.
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;
  let payload: string;
  try {
    payload = fromB64url(encoded).toString("utf8");
  } catch {
    return null;
  }
  const expectedSig = sign(payload, args.licenseKey);
  // Constant-time compare; mismatched lengths fail safe.
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [orderId, kindRaw, expiresAtRaw] = payload.split(":");
  if (!orderId || !kindRaw || !expiresAtRaw) return null;
  if (kindRaw !== "spec" && kindRaw !== "shopify" && kindRaw !== "woo") {
    return null;
  }
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { orderId, kind: kindRaw, expiresAt };
}
