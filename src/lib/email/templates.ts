import type { AuditResult } from "@/lib/audit/score";
import type { ThemeRecommendation } from "@/lib/audit/niche";

/**
 * Email templates for the audit nurture sequence. All templates render both
 * HTML and plaintext from the same data — no React. Plain string templates
 * are easier to maintain at this scale, easier to inline-style for client
 * compatibility, and don't pull in react-email's build chain.
 *
 * Design rules:
 * - System font stack — looks native everywhere, no fonts to load.
 * - Single column, ≤600px wide — readable in Gmail's narrow column.
 * - One CTA per email — the audit world is full of multi-CTA emails that
 *   convert worse than single-CTA ones.
 * - The unsubscribe footer is plain text — Resend handles List-Unsubscribe
 *   headers but we still want a visible opt-out for trust.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://shoplanding.io";

export type AuditEmailContext = {
  email: string;
  auditId: string;
  url: string;
  hostname: string;
  score: number;
  result: AuditResult;
  recommendation: ThemeRecommendation | null;
};

export function unlockEmail(ctx: AuditEmailContext) {
  const reportUrl = `${SITE_URL}/audit/${ctx.auditId}#top-fixes`;
  const themeUrl = ctx.recommendation
    ? `${SITE_URL}${ctx.recommendation.href}`
    : `${SITE_URL}/#themes`;
  const themeLabel = ctx.recommendation?.label ?? "the matching theme";

  const top = ctx.result.topFixes.slice(0, 3);

  const subject = `Your ShopLanding audit · ${ctx.score}/100 for ${ctx.hostname}`;

  const fixesHtml = top.length
    ? `<ol style="margin:0 0 24px 0;padding-left:20px;color:#1d2125;font-size:15px;line-height:1.55">
        ${top
          .map(
            (f) =>
              `<li style="margin:0 0 10px 0"><strong>${escape(f.text)}</strong>${
                f.note ? `<br/><span style="color:#6b7280;font-size:13px">${escape(f.note)}</span>` : ""
              }</li>`,
          )
          .join("")}
      </ol>`
    : `<p style="margin:0 0 24px 0;color:#6b7280;font-size:14px"><em>No deterministic fails — see the full report for AI-scored manual rules.</em></p>`;

  const fixesText = top.length
    ? top.map((f, i) => `  ${i + 1}. ${f.text}${f.note ? ` — ${f.note}` : ""}`).join("\n")
    : "  (No deterministic fails — see the full report.)";

  const html = wrap({
    subject,
    body: `
      <p style="margin:0 0 16px 0;color:#1d2125;font-size:16px">Your audit for <strong>${escape(ctx.hostname)}</strong> scored <strong>${ctx.score}/100</strong>.</p>
      <p style="margin:0 0 24px 0;color:#1d2125;font-size:15px">Top fixes ranked by impact:</p>
      ${fixesHtml}
      <p style="margin:0 0 32px 0">
        <a href="${reportUrl}" style="display:inline-block;padding:12px 22px;border-radius:9999px;background:#00a85f;color:white;font-weight:600;text-decoration:none;font-size:15px">See the full report →</a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="margin:0 0 12px 0;color:#1d2125;font-size:15px"><strong>Want a theme that ships these by default?</strong></p>
      <p style="margin:0 0 20px 0;color:#4b5563;font-size:14px;line-height:1.55">
        ${
          ctx.recommendation
            ? escape(ctx.recommendation.reason)
            : "Every ShopLanding theme is built to satisfy all 69 playbook rules out of the box."
        }
      </p>
      <p style="margin:0 0 8px 0">
        <a href="${themeUrl}" style="color:#007a45;font-weight:600;text-decoration:none;font-size:15px">Browse ${escape(themeLabel)} →</a>
      </p>
    `,
  });

  const text =
`Your audit for ${ctx.hostname} scored ${ctx.score}/100.

Top fixes ranked by impact:
${fixesText}

Full report: ${reportUrl}

----

Want a theme that ships these by default?
${ctx.recommendation ? ctx.recommendation.reason : "Every ShopLanding theme is built to satisfy all 69 playbook rules out of the box."}

Browse ${themeLabel}: ${themeUrl}

${footerText(ctx.email)}`;

  return { subject, html, text };
}

export function nurtureDay3Email(ctx: AuditEmailContext) {
  const reportUrl = `${SITE_URL}/audit/${ctx.auditId}`;
  const playbookUrl = `${SITE_URL}/playbook`;
  const themeUrl = ctx.recommendation
    ? `${SITE_URL}${ctx.recommendation.href}`
    : `${SITE_URL}/#themes`;

  const niche = ctx.recommendation?.niche ?? "DTC";
  const subject = `Three things ${niche} brands always get wrong on their PDP`;

  const html = wrap({
    subject,
    body: `
      <p style="margin:0 0 16px 0;color:#1d2125;font-size:16px">Hey — quick note about your audit on <strong>${escape(ctx.hostname)}</strong>.</p>
      <p style="margin:0 0 16px 0;color:#1d2125;font-size:15px">Across the audits we've run on ${niche} stores, three misses come up over and over:</p>
      <ol style="margin:0 0 24px 0;padding-left:20px;color:#1d2125;font-size:15px;line-height:1.6">
        <li style="margin:0 0 12px 0"><strong>Star rating not visible near the title.</strong> Reviews hidden 4 scrolls down. Move them up — the buyer needs trust before they read the spec list.</li>
        <li style="margin:0 0 12px 0"><strong>No express-pay row near the CTA.</strong> Apple Pay / Shop Pay / PayPal reduce checkout drop-off by 20–35%. They're free to enable.</li>
        <li style="margin:0 0 12px 0"><strong>No bundle or quantity discount.</strong> Single-item PDPs leave 15–25% AOV on the table. "Buy 2, save 15%" is the lowest-effort lift.</li>
      </ol>
      <p style="margin:0 0 24px 0;color:#4b5563;font-size:14px;line-height:1.55">Your full 69-rule playbook lives at <a href="${playbookUrl}" style="color:#007a45;text-decoration:none">/playbook</a> — every rule has its rationale + an example.</p>
      <p style="margin:0 0 8px 0">
        <a href="${reportUrl}" style="color:#007a45;font-weight:600;text-decoration:none;font-size:15px">Re-open your audit →</a>
      </p>
      <p style="margin:0 0 32px 0">
        <a href="${themeUrl}" style="color:#007a45;font-weight:600;text-decoration:none;font-size:15px">${ctx.recommendation ? `See the ${escape(ctx.recommendation.label)} theme →` : "Browse the themes →"}</a>
      </p>
    `,
  });

  const text =
`Hey — quick note about your audit on ${ctx.hostname}.

Across the audits we've run on ${niche} stores, three misses come up over and over:

  1. Star rating not visible near the title. Reviews hidden 4 scrolls down. Move them up.
  2. No express-pay row near the CTA. Apple Pay / Shop Pay / PayPal reduce checkout drop-off by 20–35%.
  3. No bundle or quantity discount. Single-item PDPs leave 15–25% AOV on the table.

Full 69-rule playbook: ${playbookUrl}
Re-open your audit: ${reportUrl}
${ctx.recommendation ? `See the ${ctx.recommendation.label} theme: ${themeUrl}` : `Browse the themes: ${themeUrl}`}

${footerText(ctx.email)}`;

  return { subject, html, text };
}

export function nurtureDay7Email(ctx: AuditEmailContext) {
  const themeUrl = ctx.recommendation
    ? `${SITE_URL}${ctx.recommendation.href}?code=AUDIT20`
    : `${SITE_URL}/#themes?code=AUDIT20`;

  const subject = `48-hour code: AUDIT20 (-20% on any ShopLanding theme)`;

  const html = wrap({
    subject,
    body: `
      <p style="margin:0 0 16px 0;color:#1d2125;font-size:16px">A week ago you audited <strong>${escape(ctx.hostname)}</strong>. Score: <strong>${ctx.score}/100</strong>.</p>
      <p style="margin:0 0 16px 0;color:#1d2125;font-size:15px">If you'd rather rebuild on a theme that ships all 69 rules out of the box, here's a 20% code good for the next 48 hours:</p>
      <p style="margin:0 0 24px 0;padding:14px 20px;background:#f4fbf6;border:1px dashed #00a85f;border-radius:8px;text-align:center;color:#007a45;font-family:ui-monospace,Menlo,monospace;font-size:18px;letter-spacing:2px;font-weight:700">AUDIT20</p>
      <p style="margin:0 0 32px 0">
        <a href="${themeUrl}" style="display:inline-block;padding:12px 22px;border-radius:9999px;background:#00a85f;color:white;font-weight:600;text-decoration:none;font-size:15px">${
          ctx.recommendation
            ? `Get ${escape(ctx.recommendation.label)} – 20% off →`
            : "Browse the themes →"
        }</a>
      </p>
      <p style="margin:0 0 16px 0;color:#6b7280;font-size:13px;line-height:1.55">No discount stacking, no second code in your inbox. One follow-up, that's it. Reply with "remove" and we hard-delete the row.</p>
    `,
  });

  const text =
`A week ago you audited ${ctx.hostname}. Score: ${ctx.score}/100.

If you'd rather rebuild on a theme that ships all 69 rules out of the box, here's a 20% code good for the next 48 hours:

   AUDIT20

${ctx.recommendation ? `Get ${ctx.recommendation.label} (20% off): ${themeUrl}` : `Browse the themes: ${themeUrl}`}

No discount stacking, no second code in your inbox. One follow-up, that's it. Reply with "remove" and we hard-delete the row.

${footerText(ctx.email)}`;

  return { subject, html, text };
}

// ── helpers ─────────────────────────────────────────────────────────────

function wrap({ subject, body }: { subject: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${escape(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7f6;-webkit-text-size-adjust:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7f6">
      <tr><td align="center" style="padding:32px 16px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:white;border:1px solid #e5e7eb;border-radius:14px">
          <tr><td style="padding:28px 32px 8px 32px">
            <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b7280">ShopLanding</p>
          </td></tr>
          <tr><td style="padding:16px 32px 24px 32px">
            ${body}
          </td></tr>
          <tr><td style="padding:20px 32px 28px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.55">You're getting this because you ran an audit at ShopLanding.<br/>Reply "remove" and we hard-delete your row from our database.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function footerText(email: string): string {
  return `--
ShopLanding — sent to ${email}
Reply "remove" and we hard-delete your row.`;
}

function escape(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
