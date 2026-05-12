"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { authClient } from "@/lib/auth/client";

type ProviderProps = ComponentProps<typeof NeonAuthUIProvider>;

/**
 * Mounts the Neon Auth provider so descendant client components can use
 * `authClient.useSession()` and `<AuthView>`. Scoped to surfaces that need it
 * (`/auth/*` and `/account/*`) — the marketing pages don't include this.
 *
 * SSR gate: `<NeonAuthUIProvider>` injects a `<script>` tag for the auth
 * runtime, which Next 16 / React 19 warn about when encountered during the
 * server pass ("Scripts inside React components are never executed when
 * rendering on the client"). We render children unwrapped on the server +
 * first paint, then mount the provider after `useEffect`. Any client-side
 * `useSession()` calls inside descendants pre-mount are no-ops anyway; the
 * AuthView component has its own mount gate for the same reason.
 */
export default function AuthProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <>{children}</>;

  return (
    <NeonAuthUIProvider
      authClient={authClient as unknown as ProviderProps["authClient"]}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
