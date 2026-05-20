import Anthropic from "@anthropic-ai/sdk";

/**
 * Lazy Anthropic client. Mirrors the Resend / Lemon Squeezy wrappers — won't throw at module
 * load if the key is missing so the rest of the app can boot. Callers should
 * either gate on `isAnthropicConfigured()` or wrap the call in try/catch and
 * treat absence as a soft failure.
 */
let _client: Anthropic | null = null;

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/** Defaultable via env so we can swap models without a deploy. */
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
