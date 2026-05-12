import { NextResponse } from "next/server";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";

type Ctx = { params: Promise<{ path: string[] }> };

/**
 * Forwarder for every Neon Auth HTTP method. Same-origin proxy so the client
 * doesn't need a public auth URL — the cookie-only flow is more robust to CDNs
 * and doesn't leak the upstream host.
 *
 * Returns a structured 503 if auth isn't configured rather than crashing.
 */
function forward(method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH") {
  return async (request: Request, context: Ctx) => {
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { error: "Auth is not configured." },
        { status: 503 },
      );
    }
    const h = getAuth().handler();
    const fn = h[method] as (
      req: Request,
      ctx: Ctx,
    ) => Promise<Response>;
    return fn(request, context);
  };
}

export const GET = forward("GET");
export const POST = forward("POST");
export const PUT = forward("PUT");
export const DELETE = forward("DELETE");
export const PATCH = forward("PATCH");
