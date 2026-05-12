"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Client-side auth handle. Talks to `/api/auth/*` on the same origin (the
 * proxy forwards to the Neon Auth server). No env vars on the client side —
 * server-side configuration alone is enough.
 *
 * Use the React hooks (`authClient.useSession()`, etc.) inside `"use client"`
 * components that live underneath `<AuthProviders>`.
 */
export const authClient = createAuthClient();
