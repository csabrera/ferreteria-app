import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { getSettings } from "@/server/queries/settings.queries";

/**
 * Marcar TODAS las rutas como dinámicas (renderizadas on-demand).
 *
 * Sin esto, Next.js intenta prerenderar páginas en build time → cada page
 * llama Prisma → la BD no es accesible durante el build de Railway (red
 * privada) → falla con "Can't reach database server".
 *
 * Además, en un admin app multi-usuario las páginas SIEMPRE necesitan data
 * fresca (productos, ventas, auditoría, etc.). Prerenderar estáticamente
 * sería incorrecto: cada usuario vería un snapshot stale.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: {
      default: settings.businessName,
      template: `%s · ${settings.businessName}`,
    },
    description:
      settings.slogan ?? `${settings.businessName} — Sistema de gestión interna`,
    icons: settings.faviconUrl
      ? [{ rel: "icon", url: settings.faviconUrl }]
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Progress bar de navegación. Usa el color de acento configurado. */}
        <NextTopLoader
          color={settings.accentColor}
          height={3}
          showSpinner={false}
          shadow={`0 0 10px ${settings.accentColor}, 0 0 5px ${settings.accentColor}`}
        />
        <AuthSessionProvider>
          <QueryProvider>
            <SettingsProvider settings={settings}>
              {children}
              <ToastProvider />
            </SettingsProvider>
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
