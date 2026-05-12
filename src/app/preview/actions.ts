"use server";

import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/db";
import type { LandingTweaks } from "@/components/landing/types";

/**
 * Persist buyer's tweaks to `Order.tweaks`.
 *
 * Authentication strategy (pre-auth-phase): the `previewSlug` is itself the
 * shared secret. It's a 12-char URL-safe random string only the buyer (and
 * anyone they share the URL with — by design) ever sees. When `@neondatabase/auth`
 * lands in Phase 7, we'll layer a session check on top so the buyer's signed-in
 * account always wins over slug-only access.
 *
 * The `tweaks` argument is sanitized to the keys we know — no surprise schema
 * additions sneak into the JSON column.
 */
const ALLOWED_TOKEN_KEYS = [
  "accent",
  "accentDeep",
  "accentSoft",
  "ink",
  "ink2",
  "muted",
  "line",
  "surface",
  "bg",
  "fontDisplay",
  "fontBody",
  "fontMono",
] as const;

export type SaveTweaksResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveOrderTweaks(args: {
  previewSlug: string;
  tweaks: LandingTweaks;
}): Promise<SaveTweaksResult> {
  if (!args.previewSlug) {
    return { ok: false, error: "Missing preview slug." };
  }

  const sanitized: Record<string, string> = {};
  for (const k of ALLOWED_TOKEN_KEYS) {
    const v = args.tweaks[k];
    if (typeof v === "string" && v.length > 0 && v.length < 200) {
      sanitized[k] = v;
    }
  }
  if (typeof args.tweaks.ctaCopy === "string") {
    const trimmed = args.tweaks.ctaCopy.trim();
    if (trimmed.length > 0 && trimmed.length < 80) {
      sanitized.ctaCopy = trimmed;
    }
  }

  const prisma = getPrisma();
  try {
    const updated = await prisma.order.updateMany({
      where: { previewSlug: args.previewSlug, status: "paid" },
      data: { tweaks: sanitized as object },
    });
    if (updated.count === 0) {
      return { ok: false, error: "Order not found or not paid." };
    }
  } catch (err) {
    console.error("[preview] saveOrderTweaks failed", err);
    return { ok: false, error: "Could not save. Try again." };
  }

  // `revalidatePath` only works inside a Next request context. The save
  // already succeeded above, so a missing static-generation store (e.g. when
  // the action is invoked from a script harness) shouldn't surface as a
  // user-visible error.
  try {
    revalidatePath(`/preview/${args.previewSlug}`);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[preview] revalidatePath skipped:", err);
    }
  }
  return { ok: true };
}
