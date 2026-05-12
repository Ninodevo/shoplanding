"use client";

import { useEffect, useState } from "react";
import { AuthView } from "@neondatabase/auth/react/ui";

/**
 * Neon's `<AuthView>` toggles classes around hydration which causes a SSR/CSR
 * mismatch warning. We defer the mount one microtask so the first paint stays
 * clean, and show a small skeleton while we wait.
 */
export default function StyledAuthView({
  path,
  callbackURL,
}: {
  path: string;
  callbackURL?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <div
        className="min-h-[320px] w-full max-w-md animate-pulse rounded-xl border border-[var(--line)] bg-white"
        aria-busy="true"
        aria-label="Loading sign-in"
      />
    );
  }

  return (
    <AuthView
      path={path}
      callbackURL={callbackURL ?? "/account/downloads"}
      redirectTo={callbackURL ?? "/account/downloads"}
    />
  );
}
