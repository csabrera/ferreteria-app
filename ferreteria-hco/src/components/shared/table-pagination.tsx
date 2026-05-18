"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** Página actual (1-based). */
  page: number;
  /** Tamaño de página. */
  pageSize: number;
  /** Total de filas (de la query, sin paginar). */
  total: number;
  /** Total de páginas (`Math.ceil(total/pageSize)` o 1 si total=0). */
  totalPages: number;
  /** Path base al que navegar al cambiar de página. */
  basePath: string;
  /**
   * Nombre del query param de paginación. Permite varias paginaciones
   * en la misma URL (ej. `productosPage` vs `pedidosPage`). Default: "page".
   */
  paramName?: string;
  /** Etiqueta singular/plural del recurso para el label. Default: "fila". */
  label?: { singular: string; plural: string };
};

/**
 * Paginación URL-driven reusable. Preserva los demás query params al navegar.
 * Cambia solo el param de paginación (`paramName` o `page` por default).
 *
 * Usa `useTransition` para mostrar estado pending mientras el server responde:
 * - Loader2 spinner inline junto al label "Mostrando X–Y"
 * - Botones disabled durante la transición
 * - opacity-60 en el contenedor
 *
 * Combinado con `<NextTopLoader>` global, da un feedback visual completo
 * (barra superior + indicador local).
 */
export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  basePath,
  paramName = "page",
  label = { singular: "fila", plural: "filas" },
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goTo(p: number) {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete(paramName);
    else next.set(paramName, String(p));
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${basePath}?${qs}` : basePath);
    });
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const canPrev = page > 1 && !isPending;
  const canNext = page < totalPages && !isPending;
  const noun = total === 1 ? label.singular : label.plural;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm transition-opacity",
        isPending && "opacity-60",
      )}
    >
      <p className="flex items-center gap-2 text-muted-foreground">
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Mostrando <strong>{from}</strong>–<strong>{to}</strong> de{" "}
        <strong>{total}</strong> {noun}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(1)}
          disabled={!canPrev}
          title="Primera página"
          className="h-7 w-7 p-0"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page - 1)}
          disabled={!canPrev}
          title="Anterior"
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 font-mono text-xs">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page + 1)}
          disabled={!canNext}
          title="Siguiente"
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(totalPages)}
          disabled={!canNext}
          title="Última página"
          className="h-7 w-7 p-0"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// parsePageParam y paginationSlice se exportan desde @/lib/pagination
// porque este archivo es "use client" y los server components no pueden
// importar funciones puras desde módulos client (Next.js las serializa).
