import { createRequire } from "node:module";
import type { Browser, Page } from "playwright-core";
import { isBlockedHost } from "./fetch";
import { EMPTY_PROBES, type RenderedProbes } from "./probes";

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
  /** Measured + interaction signals — see probes.ts. */
  probes: RenderedProbes;
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
    // Dead product URLs often client-side redirect to the homepage — a
    // faithful audit of the wrong page is worse than an error (found via
    // Brooklinen: a pseudo-product handle JS-redirected to "/").
    const requestedPath = new URL(url).pathname;
    const landedPath = new URL(finalUrl).pathname;
    if (requestedPath !== "/" && landedPath === "/") {
      throw new Error(
        `page redirected to the homepage (${finalUrl}) — the product URL looks dead or region-blocked`,
      );
    }
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

    // Probes run AFTER html + screenshot are captured — the interaction
    // probes mutate the page (variant clicks, ATC click) and the last one
    // may navigate away entirely.
    const probes = await collectProbes(page);

    return { html, finalUrl, screenshotBase64, probes };
  } finally {
    await browser.close();
  }
}

/**
 * Measurement + interaction probes. Each step is individually fenced —
 * a selector that matches nothing on some exotic theme must never sink
 * the audit, it just leaves that probe at its EMPTY default.
 */
async function collectProbes(page: Page): Promise<RenderedProbes> {
  const probes: RenderedProbes = { ...EMPTY_PROBES };

  // tsx/esbuild compile the probe functions with `keepNames`, which injects
  // `__name(...)` helper calls — the helper doesn't exist in the page when
  // Playwright serializes the function source. Shim it (no-op in prod
  // builds that don't inject it).
  await page
    .evaluate("window.__name = window.__name || ((f) => f)")
    .catch(() => {});

  // ── 1. Static measurements (geometry, computed styles) — one evaluate.
  try {
    Object.assign(probes, await page.evaluate(measureInPage));
  } catch (err) {
    console.warn("[rendered] measurement probe failed", err);
  }

  // ── 2. Sticky buy bar: scroll well past the hero, wait, look for a
  // fixed/sticky bar carrying an add-to-cart control.
  try {
    await page.evaluate(() =>
      window.scrollTo(0, Math.min(2400, document.body.scrollHeight / 2)),
    );
    await page.waitForTimeout(900);
    probes.stickyBarWithAtc = await page.evaluate(detectStickyAtcInPage);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
  } catch (err) {
    console.warn("[rendered] sticky probe failed", err);
  }

  // ── 3. Variant interaction: pick a different option, watch price + image.
  try {
    probes.variantProbe = await page.evaluate(probeVariantsInPage);
  } catch (err) {
    console.warn("[rendered] variant probe failed", err);
  }

  // ── 4. ATC click — LAST, may navigate to cart/checkout.
  try {
    probes.atcProbe = await probeAtc(page);
  } catch (err) {
    console.warn("[rendered] ATC probe failed", err);
  }

  return probes;
}

/* ─── in-page functions (serialized into the browser) ─────────────────── */

function measureInPage() {
  const vis = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 2 && r.height > 2 && s.visibility !== "hidden" && s.display !== "none";
  };
  const px = (v: string) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
  };

  // Title vs body font size
  const h1 = Array.from(document.querySelectorAll("h1")).find(vis) ?? null;
  const h1FontPx = h1 ? px(getComputedStyle(h1).fontSize) : null;
  const para = Array.from(document.querySelectorAll("p"))
    .filter(vis)
    .sort((a, b) => (b.textContent?.length ?? 0) - (a.textContent?.length ?? 0))[0];
  const bodyFontPx = para
    ? px(getComputedStyle(para).fontSize)
    : px(getComputedStyle(document.body).fontSize);

  // Buy box anchor: the visible add-to-cart control
  const atcRe = /add to (cart|bag|basket)|buy now|add to cart/i;
  const atc =
    Array.from(document.querySelectorAll("button, input[type=submit], a")).find(
      (el) =>
        atcRe.test(
          (el.textContent || (el as HTMLInputElement).value || "").trim(),
        ) && vis(el),
    ) ?? null;
  const buyBox = atc
    ? atc.closest("form") ??
      atc.closest('[class*="product" i], [class*="buy" i], section, aside') ??
      atc
    : null;

  // Gallery anchor: the largest visible image in the top half of the page
  const heroImgs = Array.from(document.querySelectorAll("img"))
    .filter(vis)
    .filter((el) => el.getBoundingClientRect().top + window.scrollY < 2400)
    .sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return rb.width * rb.height - ra.width * ra.height;
    });
  const mainImg = heroImgs[0] ?? null;

  // Layout: gallery vs buy box geometry (desktop viewport). The gallery
  // anchor is the largest image that VERTICALLY OVERLAPS the buy box —
  // anchoring on the page's biggest image grabs below-fold marketing
  // banners and reports "not side by side" for perfectly standard PDPs.
  let layout: { sideBySide: boolean; galleryLeft: boolean } | null = null;
  if (buyBox) {
    const bb = buyBox.getBoundingClientRect();
    const overlapping = heroImgs.slice(0, 8).find((img) => {
      const gi = img.getBoundingClientRect();
      const overlap = Math.min(gi.bottom, bb.bottom) - Math.max(gi.top, bb.top);
      return (
        overlap > Math.min(gi.height, bb.height) * 0.3 &&
        Math.abs(gi.left - bb.left) > 100 &&
        gi.width > 200
      );
    });
    if (overlapping) {
      const gi = overlapping.getBoundingClientRect();
      layout = { sideBySide: true, galleryLeft: gi.left < bb.left };
    } else if (mainImg) {
      layout = { sideBySide: false, galleryLeft: false };
    }
  }

  // Rating widget distance to title
  let ratingDistancePx: number | null = null;
  if (h1) {
    const hr = h1.getBoundingClientRect();
    const rating = Array.from(
      document.querySelectorAll(
        '[class*="rating" i], [class*="stars" i], [class*="review" i], [aria-label*="out of 5" i], [aria-label*="stars" i]',
      ),
    )
      .filter(vis)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return Math.abs(r.top - hr.bottom) + Math.abs(r.left - hr.left) / 4;
      })
      .sort((a, b) => a - b)[0];
    ratingDistancePx = rating !== undefined ? Math.round(rating) : null;
  }

  // Benefit bullets near the title (checkmark/icon list within ~400px below)
  let benefitsNearTitle = false;
  if (h1) {
    const hb = h1.getBoundingClientRect().bottom;
    benefitsNearTitle = Array.from(document.querySelectorAll("ul, ol")).some(
      (list) => {
        if (!vis(list)) return false;
        const r = list.getBoundingClientRect();
        if (r.top < hb - 40 || r.top > hb + 400) return false;
        const items = Array.from(list.querySelectorAll("li")).filter(vis);
        if (items.length < 2) return false;
        return items.some(
          (li) =>
            /[✓✔☑✅•·]/.test(li.textContent ?? "") || li.querySelector("svg, img"),
        );
      },
    );
  }

  // Gallery arrows: visible prev/next controls near the main image
  let galleryArrows = false;
  if (mainImg) {
    const gr = mainImg.getBoundingClientRect();
    galleryArrows = Array.from(
      document.querySelectorAll(
        '[class*="arrow" i], [class*="prev" i], [class*="next" i], [aria-label*="next" i], [aria-label*="previous" i]',
      ),
    ).some((el) => {
      if (!vis(el)) return false;
      const r = el.getBoundingClientRect();
      return (
        r.top < gr.bottom + 80 &&
        r.bottom > gr.top - 80 &&
        r.width < 120 &&
        r.height < 120
      );
    });
  }

  // Slider library markers
  const htmlLower = document.documentElement.outerHTML.slice(0, 400_000).toLowerCase();
  const sliderLib =
    ["swiper", "flickity", "splide", "glide", "keen-slider", "slick-slider"].find(
      (lib) => htmlLower.includes(lib),
    ) ?? null;

  // Zoom affordance
  const zoomMarkers = /photoswipe|magnif|image-zoom|zoom-image|data-zoom|click to zoom|drift-zoom/i.test(
    htmlLower,
  );

  // Quantity control near the buy box — visible controls only (Shopify
  // themes ship hidden quantity inputs that would false-positive here)
  let qtyControl: "stepper" | "dropdown" | "input" | null = null;
  const qtyScope = (buyBox as Element | null) ?? document;
  const qtySelect = Array.from(
    qtyScope.querySelectorAll(
      'select[name*="quantity" i], select[id*="quantity" i], select[class*="quantity" i]',
    ),
  ).find(vis);
  const qtyInput = Array.from(
    qtyScope.querySelectorAll(
      'input[type="number"], input[name*="quantity" i], input[class*="qty" i], input[class*="quantity" i]',
    ),
  ).find(vis);
  if (qtyInput) {
    const wrap = qtyInput.closest("div, fieldset");
    const hasStepBtns =
      wrap != null &&
      Array.from(wrap.querySelectorAll("button")).some((b) =>
        /[+\-−＋]/.test((b.textContent ?? "").trim()),
      );
    qtyControl = hasStepBtns ? "stepper" : "input";
  } else if (qtySelect) {
    qtyControl = "dropdown";
  }

  // Description readability: the longest paragraph's measured typography
  let descriptionTypography: {
    fontPx: number;
    lineHeightRatio: number;
    charsPerLine: number;
  } | null = null;
  if (para) {
    const s = getComputedStyle(para);
    const fontPx = parseFloat(s.fontSize);
    const lineH = parseFloat(s.lineHeight);
    const width = para.getBoundingClientRect().width;
    if (Number.isFinite(fontPx) && fontPx > 0 && width > 0) {
      descriptionTypography = {
        fontPx: Math.round(fontPx * 10) / 10,
        lineHeightRatio: Number.isFinite(lineH)
          ? Math.round((lineH / fontPx) * 100) / 100
          : 1.2,
        // ~0.5em average glyph width is the classic approximation
        charsPerLine: Math.round(width / (fontPx * 0.5)),
      };
    }
  }

  // Accordions below the fold
  const accordionCount =
    document.querySelectorAll("details").length +
    Array.from(document.querySelectorAll("[aria-expanded]")).filter(
      (el) => vis(el) && el.getBoundingClientRect().top + window.scrollY > 900,
    ).length;

  // Reviews section background vs page background
  let reviewsBgDistinct: boolean | null = null;
  const reviewsSection = Array.from(
    document.querySelectorAll('[id*="review" i], [class*="review" i]'),
  )
    .filter(vis)
    .sort(
      (a, b) =>
        b.getBoundingClientRect().height - a.getBoundingClientRect().height,
    )[0];
  if (reviewsSection) {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    let el: Element | null = reviewsSection;
    let bg = "rgba(0, 0, 0, 0)";
    while (el && el !== document.body) {
      const c = getComputedStyle(el).backgroundColor;
      if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) {
        bg = c;
        break;
      }
      el = el.parentElement;
    }
    reviewsBgDistinct = bg !== "rgba(0, 0, 0, 0)" && bg !== bodyBg;
  }

  return {
    h1FontPx,
    bodyFontPx,
    layout,
    ratingDistancePx,
    benefitsNearTitle,
    galleryArrows,
    sliderLib,
    zoomMarkers,
    qtyControl,
    descriptionTypography,
    accordionCount,
    reviewsBgDistinct,
  };
}

function detectStickyAtcInPage() {
  const atcRe = /add to (cart|bag|basket)|buy now/i;
  return Array.from(document.querySelectorAll("*")).some((el) => {
    const s = getComputedStyle(el);
    if (s.position !== "fixed" && s.position !== "sticky") return false;
    const r = el.getBoundingClientRect();
    if (r.width < window.innerWidth * 0.5 || r.height > 220 || r.height < 20) return false;
    // pinned to top or bottom edge of the viewport
    if (r.top > 8 && r.bottom < window.innerHeight - 8) return false;
    return atcRe.test(el.textContent ?? "");
  });
}

async function probeVariantsInPage() {
  const vis = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  };
  const atcRe = /add to (cart|bag|basket)|buy now/i;
  const atc = Array.from(
    document.querySelectorAll("button, input[type=submit]"),
  ).find(
    (el) =>
      atcRe.test((el.textContent || (el as HTMLInputElement).value || "").trim()) &&
      vis(el),
  );
  const scope: Element | Document = atc
    ? atc.closest("form") ?? atc.closest('[class*="product" i], section') ?? document
    : document;

  const priceText = () => {
    const el = Array.from(scope.querySelectorAll("*")).find(
      (e) =>
        e.children.length === 0 &&
        /[$€£]\s?\d/.test(e.textContent ?? "") &&
        vis(e),
    );
    return el?.textContent?.trim() ?? null;
  };
  const mainImgSrc = () => {
    const img = Array.from(document.querySelectorAll("img"))
      .filter(vis)
      .sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return rb.width * rb.height - ra.width * ra.height;
      })[0];
    return img?.currentSrc || img?.src || null;
  };

  // Variant candidates: radio groups with >1 option, or selects with >1
  // option (skip quantity selects).
  const radios = Array.from(
    scope.querySelectorAll('input[type="radio"]'),
  ) as HTMLInputElement[];
  const groups = new Map<string, HTMLInputElement[]>();
  for (const r of radios) {
    const g = groups.get(r.name) ?? [];
    g.push(r);
    groups.set(r.name, g);
  }
  const radioGroup = Array.from(groups.values()).find((g) => g.length > 1);
  const select = (Array.from(scope.querySelectorAll("select")) as HTMLSelectElement[]).find(
    (s) => s.options.length > 1 && !/quantity|qty/i.test(s.name + s.id + s.className),
  );

  const optionsFound = radioGroup?.length ?? select?.options.length ?? 0;
  if (!radioGroup && !select) {
    return { optionsFound: 0, clicked: false, priceChanged: false, imageChanged: false };
  }

  const beforePrice = priceText();
  const beforeImg = mainImgSrc();

  if (radioGroup) {
    const other = radioGroup.find((r) => !r.checked) ?? radioGroup[1];
    const label = other
      ? document.querySelector(`label[for="${other.id}"]`) ?? other.closest("label")
      : null;
    ((label as HTMLElement | null) ?? other)?.click();
  } else if (select) {
    select.selectedIndex = select.selectedIndex === 0 ? 1 : 0;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  await new Promise((r) => setTimeout(r, 1500));

  const afterPrice = priceText();
  const afterImg = mainImgSrc();
  return {
    optionsFound,
    clicked: true,
    priceChanged: beforePrice !== null && afterPrice !== null && beforePrice !== afterPrice,
    imageChanged: beforeImg !== null && afterImg !== null && beforeImg !== afterImg,
  };
}

async function probeAtc(
  page: Page,
): Promise<NonNullable<RenderedProbes["atcProbe"]>> {
  const beforeUrl = page.url();
  const clicked = await page.evaluate(() => {
    const vis = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    };
    // Buttons first; ATC-labeled <a> links second (some themes use anchors)
    const cands = [
      ...Array.from(document.querySelectorAll("button, input[type=submit]")),
      ...Array.from(document.querySelectorAll("a")),
    ];
    const atc = cands.find(
      (el) =>
        /add to (cart|bag|basket)|buy now/i.test(
          (el.textContent || (el as HTMLInputElement).value || "").trim(),
        ) && vis(el),
    );
    if (!atc) return false;
    (atc as HTMLElement).click();
    return true;
  });
  if (!clicked) return { clicked: false, outcome: "none" };

  await page.waitForTimeout(2500);

  const afterUrl = page.url();
  if (afterUrl !== beforeUrl) {
    if (/checkout/i.test(afterUrl)) return { clicked: true, outcome: "checkout" };
    if (/\/cart\b/i.test(afterUrl)) return { clicked: true, outcome: "cart-page" };
  }

  const drawer = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("*")).some((el) => {
      const s = getComputedStyle(el);
      if (s.position !== "fixed") return false;
      if (s.visibility === "hidden" || s.display === "none" || parseFloat(s.opacity) < 0.5) return false;
      const r = el.getBoundingClientRect();
      // side panel: substantial height, partial width, hugging an edge
      const hugsEdge = r.right >= window.innerWidth - 4 || r.left <= 4;
      const panelSized =
        r.width >= 240 && r.width <= window.innerWidth * 0.75 && r.height >= window.innerHeight * 0.5;
      return hugsEdge && panelSized && /cart|bag|basket/i.test(el.textContent ?? "");
    });
  });
  return { clicked: true, outcome: drawer ? "drawer" : "none" };
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
