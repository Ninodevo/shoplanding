import type { ExtractedPage } from "./extract";
import { runRules, type RuleResult } from "./rules";

export type BlockScore = {
  blockSlug: string;
  pass: number;
  fail: number;
  unknown: number;
  total: number;
  /** 0–100 — `pass / (pass + fail)`. `unknown` is excluded from the denominator. */
  score: number;
};

export type AuditResult = {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  overallScore: number;
  blocks: BlockScore[];
  rules: RuleResult[];
  /** The 5 highest-weight failed rules, ranked. The "fix these first" list. */
  topFixes: RuleResult[];
  /** Page snapshot used to score — kept for transparency. */
  page: PageSnapshot;
};

/** Trimmed extract for transparency in the report — drop noisy fields. */
export type PageSnapshot = {
  title: string | null;
  metaDescription: string | null;
  finalUrl: string;
  starRating: number | null;
  reviewCount: number | null;
  priceText: string | null;
  productImageCount: number;
  outgoingLinkCount: number;
  schemaName: string | null;
  schemaBrand: string | null;
};

export function scoreAudit(args: {
  url: string;
  finalUrl: string;
  page: ExtractedPage;
  /**
   * Optional pre-computed rule results — used when the LLM pass has already
   * rewritten verdicts on the heuristic output. When omitted, runs the
   * heuristic rules in-process. The aggregation (block scores + overall +
   * top fixes) is identical either way.
   */
  rules?: RuleResult[];
}): AuditResult {
  const rules = args.rules ?? runRules(args.page);

  // ── Aggregate per block
  const byBlock = new Map<string, BlockScore>();
  for (const r of rules) {
    const b =
      byBlock.get(r.blockSlug) ?? {
        blockSlug: r.blockSlug,
        pass: 0,
        fail: 0,
        unknown: 0,
        total: 0,
        score: 0,
      };
    b.total += 1;
    b[r.status] += 1;
    byBlock.set(r.blockSlug, b);
  }
  for (const b of byBlock.values()) {
    const counted = b.pass + b.fail;
    b.score = counted === 0 ? 0 : Math.round((b.pass / counted) * 100);
  }
  const blocks = Array.from(byBlock.values());

  // ── Overall — weighted by rule weights. unknowns excluded from denominator.
  const weighted = rules
    .filter((r) => r.status !== "unknown")
    .reduce(
      (acc, r) => {
        acc.den += r.weight;
        if (r.status === "pass") acc.num += r.weight;
        return acc;
      },
      { num: 0, den: 0 },
    );
  const overallScore =
    weighted.den === 0 ? 0 : Math.round((weighted.num / weighted.den) * 100);

  // ── Top fixes: failed rules sorted by weight desc, then alphabetical
  const topFixes = rules
    .filter((r) => r.status === "fail")
    .sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text))
    .slice(0, 5);

  return {
    url: args.url,
    finalUrl: args.finalUrl,
    fetchedAt: new Date().toISOString(),
    overallScore,
    blocks,
    rules,
    topFixes,
    page: {
      title: args.page.title,
      metaDescription: args.page.metaDescription,
      finalUrl: args.page.finalUrl,
      starRating: args.page.starRating,
      reviewCount: args.page.reviewCount,
      priceText: args.page.priceText,
      productImageCount: args.page.productImageCount,
      outgoingLinkCount: args.page.outgoingLinkCount,
      schemaName: args.page.productSchema?.name ?? null,
      schemaBrand: args.page.productSchema?.brand ?? null,
    },
  };
}
