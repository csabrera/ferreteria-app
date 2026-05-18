/**
 * Convierte un texto en un slug URL-friendly:
 *   - lowercase
 *   - sin acentos
 *   - espacios y caracteres no alfanuméricos → guiones
 *   - sin guiones duplicados ni al inicio/final
 *
 * Ejemplos:
 *   "Cemento Portland Tipo I" → "cemento-portland-tipo-i"
 *   "Pintura látex (5L)"      → "pintura-latex-5l"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
