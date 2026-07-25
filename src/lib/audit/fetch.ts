/**
 * Safe URL fetcher for the public audit tool.
 *
 * Guards against the obvious abuse vectors: SSRF (private IP ranges),
 * runaway response size (anything over 5 MB gets aborted), slow-loris
 * (15 s deadline), and protocol-smuggling (only http/https allowed). The
 * audit tool is publicly callable so this layer is the security boundary.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 15_000;
const USER_AGENT =
  "ShopLandingAudit/1.0 (+https://shoplanding.com/audit; audit-bot)";

export type FetchedPage = {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string | null;
  bytes: number;
  html: string;
};

export class FetchError extends Error {
  constructor(
    public readonly code:
      | "invalid-url"
      | "blocked-host"
      | "timeout"
      | "too-large"
      | "non-html"
      | "http-error"
      | "redirected-home"
      | "network-error",
    message: string,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

/**
 * True when a non-homepage request ended up on the site root. Dead,
 * discontinued, or region-blocked product URLs commonly 301 to "/" — and
 * auditing a homepage while the report claims to describe a product page
 * is worse than returning an error. Shared by the static fetcher and the
 * rendered (Playwright) one, which sees the JS-driven variant of this.
 */
export function isHomepageRedirect(requested: string, final: string): boolean {
  try {
    // Normalize trailing slashes so "/" and "" compare equal.
    const reqPath = new URL(requested).pathname.replace(/\/+$/, "");
    const finPath = new URL(final).pathname.replace(/\/+$/, "");
    return reqPath !== "" && finPath === "";
  } catch {
    return false;
  }
}

export async function fetchPageForAudit(input: string): Promise<FetchedPage> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new FetchError("invalid-url", "Not a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchError("invalid-url", "Only http:// and https:// allowed.");
  }
  if (isBlockedHost(url.hostname)) {
    throw new FetchError("blocked-host", "Host is not reachable from the audit tool.");
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort("timeout"), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.8",
      },
    });
  } catch (err) {
    clearTimeout(t);
    if ((err as { name?: string }).name === "AbortError") {
      throw new FetchError("timeout", `Page took longer than ${TIMEOUT_MS / 1000}s.`);
    }
    throw new FetchError("network-error", `Could not reach the page: ${(err as Error).message}`);
  }
  clearTimeout(t);

  if (!res.ok) {
    throw new FetchError(
      "http-error",
      `Page returned HTTP ${res.status} — make sure the URL is publicly accessible.`,
    );
  }

  if (isHomepageRedirect(url.toString(), res.url)) {
    throw new FetchError(
      "redirected-home",
      `That URL redirects to the homepage (${res.url}) — the product looks discontinued, sold out, or unavailable in our region. Paste a live product URL.`,
    );
  }

  const contentType = res.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().includes("html")) {
    throw new FetchError(
      "non-html",
      `Got '${contentType}' instead of HTML. The audit only works on product pages.`,
    );
  }

  // Stream and cap at MAX_BYTES so a malicious 1GB response doesn't OOM.
  const reader = res.body?.getReader();
  if (!reader) {
    throw new FetchError("network-error", "Empty response body.");
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      try { await reader.cancel(); } catch { /* ignore */ }
      throw new FetchError(
        "too-large",
        `Page is over ${Math.round(MAX_BYTES / 1024 / 1024)} MB — likely not a product page.`,
      );
    }
    chunks.push(value);
  }
  const html = new TextDecoder("utf-8", { fatal: false }).decode(
    concatUint8(chunks),
  );

  return {
    url: input.trim(),
    finalUrl: res.url,
    status: res.status,
    contentType,
    bytes: total,
    html,
  };
}

function concatUint8(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/**
 * Quick SSRF guard. We can't `dns.lookup()` cheaply here so we block by
 * hostname pattern; the right long-term fix is DNS resolution + private-CIDR
 * check, but for v1 the cheap version covers the common-case attempts.
 */
/**
 * SSRF denylist shared by the static fetcher and the rendered (Playwright)
 * fetcher — both navigate to user-supplied URLs.
 */
export function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost") return true;
  if (h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "::1") return true;
  // IPv4 literals in private/loopback/link-local ranges
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true; // CGNAT
  }
  return false;
}
