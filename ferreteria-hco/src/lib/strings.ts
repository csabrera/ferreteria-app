/**
 * Convención del proyecto:
 *   - Campos descriptivos se almacenan en lowercase + trim en BD.
 *   - Display: siempre UPPERCASE (CSS `uppercase`).
 *   - Esto normaliza búsquedas case-insensitive y evita duplicados como
 *     "Juan" vs "JUAN" vs "juan".
 */
export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Combina apellido paterno + materno + nombres en un solo string,
 * útil para display ("APELLIDO P APELLIDO M NOMBRES").
 *
 * Aplica trim a cada parte y filtra vacíos. El display CSS hace el uppercase.
 */
export function composeFullName(parts: {
  lastNameP: string;
  lastNameM: string;
  firstName: string;
}): string {
  return [parts.lastNameP, parts.lastNameM, parts.firstName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}
