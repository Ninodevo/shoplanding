import { getAnthropic, ANTHROPIC_MODEL, isAnthropicConfigured } from "@/lib/anthropic";
import type { ExtractedPage } from "./extract";
import type { RuleResult } from "./rules";

/**
 * Qualitative scoring pass for the rules our heuristics can't judge.
 * Takes the rules currently sitting at `unknown`, feeds the LLM a cleaned
 * page snippet + structured signals, and asks for a per-rule verdict in a
 * single batched call (one round-trip per audit, not one per rule).
 *
 * Design rules:
 *   1. Never inflate the heuristic score. We only consume LLM verdicts for
 *      rules that came back `unknown`. Heuristic `pass`/`fail` is trusted.
 *   2. Graceful degradation. If the API key is missing, the call fails, or
 *      the model returns malformed JSON, we return the input unchanged.
 *      The audit still ships — just without the LLM augment.
 *   3. Hard cap on tokens out (~600). Forces the model to be terse.
 *   4. Mark every overridden rule with `aiAssisted: true` so the report can
 *      label them and the score breakdown is transparent.
 */
export async function llmScoreUnknowns(
  page: ExtractedPage,
  rules: RuleResult[],
): Promise<RuleResult[]> {
  if (!isAnthropicConfigured()) return rules;

  const unknowns = rules.filter((r) => r.status === "unknown");
  if (unknowns.length === 0) return rules;

  let verdicts: LlmVerdict[];
  try {
    verdicts = await callLlm(page, unknowns);
  } catch (err) {
    // Soft-fail — log and return heuristics-only.
    console.warn("[audit/llm] LLM pass failed, returning heuristic-only result", err);
    return rules;
  }

  const byKey = new Map<string, LlmVerdict>();
  for (const v of verdicts) byKey.set(`${v.blockSlug}::${v.ruleIndex}`, v);

  return rules.map((r) => {
    if (r.status !== "unknown") return r;
    const v = byKey.get(`${r.blockSlug}::${r.ruleIndex}`);
    if (!v) return r;
    // Guard: never let the LLM hard-fail a rule the evidence provably can't
    // verify. The prompt says this too, but a wrong "fail" on a public
    // audit is a credibility hit — enforce it in code.
    if (v.status === "fail" && failUnverifiable(page, r.text)) {
      return { ...r, note: r.note ?? v.note, aiAssisted: true };
    }
    return {
      ...r,
      status: v.status,
      note: v.note ?? r.note,
      aiAssisted: true,
    };
  });
}

/**
 * True when a "fail" verdict for this rule can't be trusted from the
 * evidence at hand. A detected review app owns rating/review display in
 * BOTH modes — widgets load async or in iframes, so even a rendered
 * capture can catch them empty (Bazaarvoice on Olipop did exactly that).
 * The gallery/variant clauses apply only to static HTML; the rendered DOM
 * shows those for real.
 */
function failUnverifiable(page: ExtractedPage, ruleText: string): boolean {
  const t = ruleText.toLowerCase();
  if (page.reviewApp && /(rating|review|star|testimonial)/.test(t)) return true;
  if (page.rendered) return false;
  // A thumbnail strip in the markup means the gallery is a JS widget whose
  // slides load client-side — media counts from static HTML prove nothing.
  if (
    (page.looksClientRendered || page.hasGalleryThumbs) &&
    /(gallery|photo|image|video|zoom|swipe)/.test(t)
  ) {
    return true;
  }
  if (
    page.looksClientRendered &&
    /(variant|selector|sticky|wallet|apple pay|bnpl)/.test(t)
  ) {
    return true;
  }
  return false;
}

type LlmVerdict = {
  blockSlug: string;
  ruleIndex: number;
  status: "pass" | "fail" | "unknown";
  note?: string;
};

async function callLlm(
  page: ExtractedPage,
  unknowns: RuleResult[],
): Promise<LlmVerdict[]> {
  const client = getAnthropic();

  const ruleLines = unknowns
    .map(
      (r, i) =>
        `${i + 1}. [block=${r.blockSlug}, ruleIndex=${r.ruleIndex}] ${r.text}`,
    )
    .join("\n");

  // Button text minus obvious UI chrome (nav toggles, drawer closes, slide
  // dots) — otherwise the model reasons about "Close menu" buttons.
  const CHROME_BUTTON = /^(close|open|menu|search|navigate to slide|previous|next|toggle)\b/i;
  const buttonExamples = [...new Set(page.buttonText)]
    .filter(
      (t) =>
        t.length >= 3 &&
        t.length <= 40 && // long strings are template dumps, not labels
        !CHROME_BUTTON.test(t) &&
        !/liquid error/i.test(t),
    )
    .slice(0, 10);

  const structured = {
    title: page.title,
    metaDescription: page.metaDescription,
    productName: page.productSchema?.name ?? null,
    brand: page.productSchema?.brand ?? null,
    priceText: page.priceText,
    availability: page.productSchema?.availability ?? null,
    variantCount: page.productSchema?.variantCount ?? null,
    starRating: page.starRating,
    reviewCount: page.reviewCount,
    reviewApp: page.reviewApp,
    hasReviewsSection: page.hasReviewsSection,
    hasFaqSection: page.hasFaqSection,
    hasComparisonSection: page.hasComparisonSection,
    hasSpecsTable: page.hasSpecsTable,
    hasGalleryThumbs: page.hasGalleryThumbs,
    hasStickyAtcMarkers: page.hasStickyAtcMarkers,
    hasExpressCheckoutMarkers: page.hasExpressCheckoutMarkers,
    hasBnplMarkers: page.hasBnplMarkers,
    cartDrawer: page.cartDrawer,
    productImageCount: page.productImageCount,
    videoCount: page.videoCount,
    outgoingLinkCount: page.outgoingLinkCount,
    looksClientRendered: page.looksClientRendered,
    h1: page.h1Text.slice(0, 3),
    buttonExamples,
  };

  const evidenceRules = page.rendered
    ? `CRITICAL — the evidence is the RENDERED DOM, captured in a real browser after JavaScript ran and the full page was scrolled:
- Review widgets, galleries, variant pickers, and wallet buttons HAVE rendered. If something is absent from these signals and text, it is genuinely absent from the page — you may mark "fail" for absence.
- Still return "unknown" for judgments that need eyes or interaction: photo attractiveness, zoom/swipe behavior, what happens after a click, layout aesthetics.
- "pass" requires evidence you can point to in the signals or text. Never pass on "likely" or "probably".
- Duplicate identical H1s are usually a responsive layout (desktop + mobile copies), not a defect.
- If a rule doesn't apply to this product category (e.g. apparel sizing on a beverage), return "unknown" with a "Not applicable — …" note. Never "fail" a rule for being inapplicable.`
    : `CRITICAL — the evidence is STATIC server HTML, not a rendered page:
- Review widgets, wallet buttons, BNPL banners, galleries, and variant pickers usually render client-side via JS. Absence from this snippet is NOT proof of absence on the live page.
- "fail" requires positive evidence of a violation (a signal that contradicts the rule), never mere absence from the snippet. Absence → "unknown".
- "pass" requires evidence you can point to in the signals or text. Never pass on "likely" or "probably".
- If reviewApp is non-null, a review widget IS installed but its stars/counts render client-side — rules about rating/review display must be "unknown", not "fail".
- If looksClientRendered is true, most media/UI is JS-rendered — be especially reluctant to fail visual rules.
- Duplicate identical H1s are usually a responsive layout (desktop + mobile copies), not a defect.
- If a rule doesn't apply to this product category (e.g. apparel sizing on a beverage), return "unknown" with a "Not applicable — …" note. Never "fail" a rule for being inapplicable.`;

  const userPrompt = `You are auditing a Shopify-style single-product landing page against a CRO playbook. For each rule below, decide pass / fail / unknown using ONLY the evidence provided.

${evidenceRules}

PAGE SIGNALS (JSON):
${JSON.stringify(structured, null, 2)}

PAGE TEXT (lowercased, first 8 KB):
"""
${page.bodyTextSnippet}
"""

RULES TO JUDGE:
${ruleLines}

Respond with a single JSON object — no prose, no markdown fences:
{
  "verdicts": [
    { "blockSlug": "<copy>", "ruleIndex": <copy>, "status": "pass" | "fail" | "unknown", "note": "<<=90 chars, why>" }
  ]
}

Include exactly one entry per rule, preserving the original blockSlug + ruleIndex. The note must be specific to what you saw (or didn't see), not generic. Notes are shown to the store owner — write in plain language and never mention internal signal names (looksClientRendered, productImageCount, reviewApp, etc.); say "the gallery loads via JavaScript" instead of "looksClientRendered=true".`;

  // ~50 tokens per verdict × up to 60 verdicts = 3000-token safety budget.
  // Haiku stays well under this on actual responses (we ask for terse notes)
  // but truncation would corrupt the JSON parse and force a fallback.
  const resp = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    temperature: 0,
    system:
      "You are a precise e-commerce conversion auditor. You return strict JSON, never prose. You prefer 'unknown' over guessing.",
    messages: [{ role: "user", content: userPrompt }],
  });

  // Concatenate all text blocks (the SDK returns a content array)
  const text = resp.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  // Strip accidental ```json fences if the model adds them despite instructions
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned non-JSON: ${text.slice(0, 200)}`);
  }

  const verdicts = (parsed as { verdicts?: unknown }).verdicts;
  if (!Array.isArray(verdicts)) throw new Error("LLM response missing verdicts[]");

  const out: LlmVerdict[] = [];
  for (const raw of verdicts) {
    if (!raw || typeof raw !== "object") continue;
    const v = raw as Record<string, unknown>;
    const blockSlug = String(v.blockSlug ?? "");
    const ruleIndex = Number(v.ruleIndex);
    const status = String(v.status ?? "");
    if (!blockSlug || !Number.isFinite(ruleIndex)) continue;
    if (status !== "pass" && status !== "fail" && status !== "unknown") continue;
    const note = typeof v.note === "string" ? v.note.slice(0, 140) : undefined;
    out.push({ blockSlug, ruleIndex, status, note });
  }

  return out;
}
