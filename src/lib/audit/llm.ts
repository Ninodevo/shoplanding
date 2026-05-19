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
    return {
      ...r,
      status: v.status,
      note: v.note ?? r.note,
      aiAssisted: true,
    };
  });
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

  const structured = {
    title: page.title,
    metaDescription: page.metaDescription,
    productName: page.productSchema?.name ?? null,
    brand: page.productSchema?.brand ?? null,
    priceText: page.priceText,
    starRating: page.starRating,
    reviewCount: page.reviewCount,
    hasReviewsSection: page.hasReviewsSection,
    hasFaqSection: page.hasFaqSection,
    hasComparisonSection: page.hasComparisonSection,
    hasSpecsTable: page.hasSpecsTable,
    productImageCount: page.productImageCount,
    videoCount: page.videoCount,
    h1: page.h1Text.slice(0, 3),
    buttonExamples: page.buttonText.slice(0, 8),
  };

  const userPrompt = `You are auditing a Shopify-style single-product landing page against a CRO playbook. For each rule below, decide pass / fail / unknown using ONLY the evidence provided. Be conservative — if you can't tell from the snippet, return "unknown" with a short reason.

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

Include exactly one entry per rule, preserving the original blockSlug + ruleIndex. The note must be specific to what you saw (or didn't see), not generic.`;

  const resp = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
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
