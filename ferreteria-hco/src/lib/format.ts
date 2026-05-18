/**
 * Formato de moneda peruana. El símbolo y código se leen de AppSettings,
 * pero por simplicidad acepta el símbolo como argumento (típicamente "S/").
 */
export function formatCurrency(
  amount: number,
  symbol: string = "S/",
): string {
  return `${symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Formato de cantidad con hasta 3 decimales, sin ceros sobrantes.
 *   1     → "1"
 *   1.5   → "1.5"
 *   1.500 → "1.5"
 *   0.125 → "0.125"
 */
export function formatQuantity(qty: number): string {
  return Number(qty)
    .toFixed(3)
    .replace(/\.?0+$/, "");
}

import { formatInTimeZone } from "date-fns-tz";

const TZ_LIMA = "America/Lima";

/**
 * Formato de fecha+hora determinista (idéntico server y client).
 * Forzar America/Lima evita hydration mismatches por TZ diferentes,
 * y un format-string explícito evita los non-breaking spaces del locale es-PE.
 *   2026-05-18T15:15:00Z → "18/05/2026 10:15"
 */
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatInTimeZone(date, TZ_LIMA, "dd/MM/yyyy HH:mm");
}

/** Solo fecha en formato peruano: "18/05/2026" */
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatInTimeZone(date, TZ_LIMA, "dd/MM/yyyy");
}
