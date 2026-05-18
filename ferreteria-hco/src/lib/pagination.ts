/**
 * Helpers puros de paginación.
 *
 * Viven en `lib/` (sin "use client") porque son importados por Server Components
 * que no pueden recibir referencias de funciones desde módulos client. Si
 * estuvieran junto al `<TablePagination>` (que sí es client), Next.js los
 * serializaría y el server vería `undefined`.
 */

/**
 * Parsea `?page=N` desde searchParams con defaults y clamp.
 */
export function parsePageParam(
  raw: string | undefined,
  fallback = 1,
): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

/**
 * Calcula `{ skip, take, totalPages }` a partir de page + pageSize + total.
 * Encapsula el clamp del page contra el total disponible (evita páginas
 * vacías cuando total < expected y page > 1).
 */
export function paginationSlice(opts: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const pageSize = Math.max(1, opts.pageSize);
  const totalPages = Math.max(1, Math.ceil(opts.total / pageSize));
  const page = Math.min(Math.max(1, opts.page), totalPages);
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
    totalPages,
  };
}
