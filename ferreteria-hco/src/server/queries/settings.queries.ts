import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Lee la configuración global del sistema (singleton AppSettings id=1).
 * Si no existe, devuelve defaults sensatos (no debería pasar tras el seed).
 *
 * Usa React.cache para deduplicar dentro del mismo request.
 */
export const getSettings = cache(async () => {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
  });

  if (!settings) {
    return {
      id: 1,
      businessName: "Ferretería HCO",
      ruc: null,
      logoUrl: null,
      slogan: null,
      accentColor: "#2563eb",
      darkModeDefault: false,
      faviconUrl: null,
      ticketHeader: null,
      ticketFooter: null,
      thankYouMessage: "¡Gracias por su compra!",
      showLogoOnTicket: true,
      currency: "PEN",
      currencySymbol: "S/",
      igvPercent: 18,
      timezone: "America/Lima",
      defaultMinStock: 5,
    };
  }

  return {
    ...settings,
    igvPercent: Number(settings.igvPercent),
    defaultMinStock: Number(settings.defaultMinStock),
  };
});

export type AppSettingsData = Awaited<ReturnType<typeof getSettings>>;
