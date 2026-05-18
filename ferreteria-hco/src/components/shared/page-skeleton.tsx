/**
 * Skeleton genérico para usar en `loading.tsx` de Next.js App Router.
 * Se muestra cuando una navegación dispara un fetch de RSC que tarda
 * más del cache de Next (~50ms). Para fetches rápidos no se ve.
 *
 * Combina con `<NextTopLoader>` (barra global) y `useTransition` en los
 * controles de paginación para feedback completo.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Título + descripción */}
      <div className="space-y-2">
        <div className="h-9 w-64 rounded-md bg-muted" />
        <div className="h-4 w-96 rounded bg-muted/70" />
      </div>

      {/* Filtros */}
      <div className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap gap-3">
          <div className="h-9 w-56 rounded-md bg-muted" />
          <div className="h-9 w-48 rounded-md bg-muted" />
          <div className="h-9 w-40 rounded-md bg-muted" />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b bg-muted/50 px-3 py-3">
          <div className="h-4 w-full rounded bg-muted/70" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <div className="h-10 w-10 shrink-0 rounded border bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted/70" />
              </div>
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
