import { redirect } from "next/navigation";
import StyledAuthView from "@/components/auth/StyledAuthView";
import { authViewPaths } from "@neondatabase/auth/react/ui/server";
import { isAuthConfigured } from "@/lib/auth/server";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

/**
 * `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password` etc. mounted via
 * Neon Auth's canonical view-paths. If auth isn't configured, we redirect to
 * the setup-auth landing so visitors aren't stuck on a broken page.
 */
export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  if (!isAuthConfigured()) {
    redirect("/account/setup-auth");
  }
  const { path } = await params;
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-8 text-center">
        <p className="mk-eyebrow">ShopLanding · {path.replace(/-/g, " ")}</p>
        <h1 className="mk-h2 mt-3">
          {path === "sign-up" ? "Create your account." : "Welcome back."}
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-2)]">
          Buyers use accounts to manage downloads, license keys, and previews.
        </p>
      </header>
      <StyledAuthView path={path} callbackURL={sp.callbackURL} />
    </div>
  );
}
