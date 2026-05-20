import { Resend } from "resend";

/**
 * Lazy Resend client wrapper. Same pattern as `lib/lemonsqueezy.ts` + `lib/anthropic.ts`:
 * won't throw at module load if the key is missing, so the app boots without
 * the email pipeline configured. Callers gate on `isResendConfigured()` and
 * treat absence as a soft failure — the audit still ships, the nurture just
 * doesn't fire.
 */
let _client: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!_client) {
    _client = new Resend(process.env.RESEND_API_KEY);
  }
  return _client;
}

/**
 * From address. Defaults to Resend's onboarding domain so devs can smoke
 * test without verifying a domain. Production should override via env to a
 * verified sender like `audit@shoplanding.io`.
 */
export const EMAIL_FROM =
  process.env.RESEND_FROM || "ShopLanding <onboarding@resend.dev>";

/**
 * Reply-to lands in the founder's inbox so people can hit reply and get a
 * human. Optional — falls back to no reply-to header.
 */
export const EMAIL_REPLY_TO = process.env.RESEND_REPLY_TO || null;

/**
 * Send wrapper. Returns `{ ok }` instead of throwing so call sites can do
 * `if (!ok) console.warn(...)` without try/catch noise. The whole point of
 * the wrapper is that email failures must NEVER break the action that
 * triggered them.
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isResendConfigured()) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      ...(EMAIL_REPLY_TO ? { replyTo: EMAIL_REPLY_TO } : {}),
      ...(args.tag ? { tags: [{ name: "kind", value: args.tag }] } : {}),
    });
    if (error) {
      console.warn("[email] send failed", { tag: args.tag, error });
      return { ok: false, error: String(error.message ?? error) };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.warn("[email] send threw", { tag: args.tag, err });
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
