import AuthProviders from "@/components/auth/AuthProviders";
import { Footer, Nav } from "@/components/marketing";

/**
 * Sign-in / sign-up surface. Wrapped in `<AuthProviders>` so `<AuthView>` has
 * the Neon Auth UI provider in scope.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviders>
      <Nav />
      <main className="mk-section">
        <div className="mk-container">{children}</div>
      </main>
      <Footer />
    </AuthProviders>
  );
}
