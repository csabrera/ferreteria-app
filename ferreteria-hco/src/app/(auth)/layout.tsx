// El login lee AppSettings (logo, businessName) → necesita BD en runtime
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      {children}
    </main>
  );
}
