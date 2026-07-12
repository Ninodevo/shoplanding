import { createRequire } from "node:module";
import type { Browser } from "playwright-core";
import { isBlockedHost } from "./fetch";

/**
 * Rendered-browser fetch for the paid deep audit. Returns the post-hydration
 * DOM (review-widget stars, JS galleries, variant pickers, sticky bars — all
 * the things static HTML can't show) plus a full-page screenshot.
 *
 * Two ways to get a browser, in order:
 *   1. `BROWSER_WS_URL` — a CDP websocket from a browser-as-API service
 *      (Browserless/Browserbase). This is the production path on Vercel,
 *      where bundling Chromium is not worth the fight.
 *   2. Local Playwright Chromium (dev + the outreach batch script on the
 *      founder's machine). Needs the `playwright` devDependency and
 *      `npx playwright install chromium` once.
 *
 * The result feeds the exact same extract → rules → LLM pipeline as the
 * static fetch — rendered HTML in, better verdicts out.
 */
export type RenderedFetch = {
  html: string;
  finalUrl: string;
  /** Base64 JPEG, viewport-width full-page capture (quality-capped). */
  screenshotBase64: string;
};

export function isRenderedFetchConfigured(): boolean {
  if (process.env.BROWSER_WS_URL) return true;
  try {
    // Bare `require` doesn't exist in every server bundle format, so build
    // one. Any failure (no Node, no playwright) means "not configured".
    const req = createRequire(process.cwd() + "/package.json");
    req.resolve("playwright");
    return true;
  } catch {
    return false;
  }
}

export async function fetchRenderedPage(url: string): Promise<RenderedFetch> {
  // Same SSRF boundary as the static fetcher — the stored audit URL passed
  // it once at creation, but re-check here: this call navigates a real
  // browser and the URL/DNS may have changed since.
  assertSafeUrl(url);

  const browser = await connectBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      locale: "en-US",
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    // Redirects are followed during goto — re-check where we landed.
    assertSafeUrl(page.url());
    // Let hydration + review widgets settle. networkidle can hang forever on
    // pages with analytics beacons, so wait for it with a soft cap instead.
    await page
      .waitForLoadState("networkidle", { timeout: 8_000 })
      .catch(() => {});
    // Scroll through the page so lazy-loaded sections (reviews, cross-sells)
    // mount, then return to the top for the screenshot. Step cap bounds the
    // walk on infinite-scroll pages.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const MAX_STEPS = 30;
      for (
        let y = 0, i = 0;
        y < document.body.scrollHeight && i < MAX_STEPS;
        y += step, i++
      ) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1_000);

    const html = await page.content();
    const finalUrl = page.url();
    // Screenshot is a nice-to-have — extremely long pages can exceed the
    // renderer's capture limit, and that must not sink the whole audit.
    let screenshotBase64 = "";
    try {
      const screenshot = await page.screenshot({
        fullPage: true,
        type: "jpeg",
        quality: 55,
      });
      screenshotBase64 = screenshot.toString("base64");
    } catch (err) {
      console.warn("[rendered] full-page screenshot failed, continuing without", err);
    }

    return { html, finalUrl, screenshotBase64 };
  } finally {
    await browser.close();
  }
}

function assertSafeUrl(input: string): void {
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    throw new Error(`rendered fetch: invalid URL ${input}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`rendered fetch: protocol ${u.protocol} not allowed`);
  }
  if (isBlockedHost(u.hostname)) {
    throw new Error(`rendered fetch: host ${u.hostname} is blocked`);
  }
}

async function connectBrowser(): Promise<Browser> {
  const ws = process.env.BROWSER_WS_URL;
  if (ws) {
    const { chromium } = await import("playwright-core");
    return chromium.connectOverCDP(ws, { timeout: 20_000 });
  }
  try {
    // Dynamic import so `playwright` stays a devDependency — production
    // uses BROWSER_WS_URL and never loads this branch.
    const { chromium } = await import("playwright");
    return (await chromium.launch({ headless: true })) as unknown as Browser;
  } catch (err) {
    throw new Error(
      "No rendered-fetch browser available. Set BROWSER_WS_URL (Browserless/Browserbase CDP websocket) or install the playwright devDependency + `npx playwright install chromium`.",
      { cause: err },
    );
  }
}
