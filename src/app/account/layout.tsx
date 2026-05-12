import AuthProviders from "@/components/auth/AuthProviders";
import { Footer, Nav } from "@/components/marketing";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
