/**
 * Validaciones específicas de Perú (celular, documentos).
 */

const PERU_MOBILE_REGEX = /^9\d{8}$/;

/**
 * Sanitiza un input de teléfono: elimina todo lo que no sea dígito y limita a 9.
 * Útil como `onChange` filter en inputs controlados.
 */
export function sanitizePeruMobile(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 9);
}

/**
 * Valida que un string sea un celular peruano: exactamente 9 dígitos
 * empezando con 9. No acepta prefijo internacional ni teléfonos fijos.
 */
export function isPeruMobile(value: string): boolean {
  return PERU_MOBILE_REGEX.test(value);
}

export const PERU_MOBILE_ERROR =
  "Debe ser un celular peruano: 9 dígitos empezando con 9";

/**
 * RUC peruano: 11 dígitos. El primer dígito identifica el tipo de contribuyente:
 *   - 10: persona natural con RUC
 *   - 15: comunidades nativas (raro)
 *   - 17: extranjeros con RUC
 *   - 20: persona jurídica (empresa)
 */
const PERU_RUC_PREFIX = ["10", "15", "17", "20"];

export function sanitizePeruRuc(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 11);
}

export function isPeruRuc(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;
  const prefix = value.slice(0, 2);
  return PERU_RUC_PREFIX.includes(prefix);
}

export const PERU_RUC_ERROR =
  "RUC inválido: 11 dígitos que empiezan con 10, 15, 17 o 20";
