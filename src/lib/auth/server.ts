import { createNeonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";

let authInstance: ReturnType<typeof createNeonAuth> | null = null;

/**
 * Singleton Neon Auth handle. Throws when env vars are missing — callers that
 * want to gracefully degrade should use `isAuthConfigured()` first.
 */
export function getAuth(): ReturnType<typeof createNeonAuth> {
  if (authInstance) return authInstance;
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl) {
    throw new Error("NEON_AUTH_BASE_URL is not set.");
  }
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEON_AUTH_COOKIE_SECRET must be set and at least 32 characters.",
    );
  }
  authInstance = createNeonAuth({
    baseUrl,
    cookies: { secret },
  });
  return authInstance;
}

export function isAuthConfigured(): boolean {
  const url = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  return Boolean(url && secret && secret.length >= 32);
}

export type SignedInUser = {
  id: string;
  email: string;
  name?: string | null;
};

/**
 * Returns the signed-in user (or null). Never throws — if Neon Auth is not
 * configured or the session is invalid, you get null.
 */
export async function getSignedInUser(): Promise<SignedInUser | null> {
  if (!isAuthConfigured()) return null;
  try {
    const { data } = await getAuth().getSession();
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name ?? null,
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] getSignedInUser failed:", err);
    }
    return null;
  }
}

/**
 * Server-side route guard. Redirects to the sign-in page if no session, or
 * to a "set up auth" landing if auth isn't configured at all.
 */
export async function requireSignedInUser(opts: {
  /** Where to send the user back after sign-in. */
  callbackURL: string;
}): Promise<SignedInUser> {
  if (!isAuthConfigured()) {
    redirect(`/account/setup-auth?back=${encodeURIComponent(opts.callbackURL)}`);
  }
  const user = await getSignedInUser();
  if (!user) {
    const next = encodeURIComponent(opts.callbackURL);
    redirect(`/auth/sign-in?callbackURL=${next}`);
  }
  return user;
}
