"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { AppSettingsData } from "@/server/queries/settings.queries";
import { hexToHslString } from "@/lib/color";

const SettingsContext = createContext<AppSettingsData | null>(null);

export function SettingsProvider({
  settings,
  children,
}: {
  settings: AppSettingsData;
  children: React.ReactNode;
}) {
  const accentHsl = useMemo(
    () => hexToHslString(settings.accentColor),
    [settings.accentColor],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", accentHsl);
    root.style.setProperty("--ring", accentHsl);
  }, [accentHsl]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings debe usarse dentro de <SettingsProvider>");
  }
  return ctx;
}
