"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Package, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export type Presentation = {
  id: string;
  unitCode: string;
  unitSymbol: string;
  unitName: string;
  factor: number;
  salePrice: number;
  barcode: string | null;
  isDefault: boolean;
};

export type SearchResult = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  image: string | null;
  salePrice: number;
  unitCode: string;
  unitSymbol: string;
  brand: string | null;
  totalStock: number;
  /** Stock SOLO de la sucursal de la caja activa. null si no se pasó storeId. */
  storeStock: number | null;
  presentations: Presentation[];
  matchedPresentationId: string | null;
};

type Props = {
  /** Foco la próxima vez que cambie esta key (incrementar para forzar focus). */
  focusToken: number;
  /** Si se pasa, el search devuelve stock SOLO de esta sucursal y bloquea agregar productos sin stock local. */
  storeId?: string;
  /** Producto con UNA sola presentación o con presentación específica matched (barcode) → agregar directo. */
  onDirectAdd: (product: SearchResult, presentationId: string) => void;
  /** Producto con múltiples presentaciones y sin match exacto → abrir picker. */
  onNeedsPicker: (product: SearchResult) => void;
  /** Callback cuando se intentó agregar un producto sin stock. */
  onNoStock?: (product: SearchResult) => void;
};

/**
 * Search del POS:
 * - Input siempre con foco (`focusToken` permite forzar refocus desde afuera).
 * - Mientras escribís: dropdown con resultados debounced (200ms).
 * - Enter: busca match exacto (barcode/SKU). Si lo encuentra, agrega directo
 *   (con `matchedPresentationId` si vino, o con la presentación default).
 *   Si NO hay match exacto pero hay resultados, abre picker del primer resultado.
 *
 * Diseñado para lectores de barcode (escriben rápido + Enter).
 */
export function PosSearch({
  focusToken,
  storeId,
  onDirectAdd,
  onNeedsPicker,
  onNoStock,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Helper que arma la URL del search incluyendo storeId si está disponible.
  const buildUrl = (query: string) => {
    const params = new URLSearchParams({ q: query });
    if (storeId) params.set("storeId", storeId);
    return `/api/productos/search?${params.toString()}`;
  };

  // El stock relevante para el POS: si vino storeStock, ese; sino totalStock.
  const stockOf = (r: SearchResult) =>
    r.storeStock !== null ? r.storeStock : r.totalStock;

  // Re-foco cuando el token cambia (tras agregar/limpiar/cerrar dialogs)
  useEffect(() => {
    inputRef.current?.focus();
  }, [focusToken]);

  // Debounced fetch al escribir
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(buildUrl(q.trim()), {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((data: { results: SearchResult[] }) => {
          setResults(data.results ?? []);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setResults([]);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, storeId]);

  /** Bloquea agregar al carrito si el stock local es 0. Devuelve true si pudo agregar. */
  function tryAdd(r: SearchResult, presentationId: string): boolean {
    if (stockOf(r) <= 0) {
      onNoStock?.(r);
      return false;
    }
    onDirectAdd(r, presentationId);
    return true;
  }

  async function handleEnter() {
    const query = q.trim();
    if (query.length < 2) return;

    // Fetch sincrónico (sin esperar debounce) — clave para scanners
    try {
      const res = await fetch(buildUrl(query));
      const data: { results: SearchResult[] } = await res.json();
      const upper = query.toUpperCase();

      const byPresBarcode = data.results.find((r) => r.matchedPresentationId);
      const byProductBarcode = data.results.find(
        (r) => r.barcode && r.barcode.toUpperCase() === upper,
      );
      const bySku = data.results.find((r) => r.sku.toUpperCase() === upper);
      const exact = byPresBarcode ?? byProductBarcode ?? bySku;

      if (exact) {
        const presentationId =
          exact.matchedPresentationId ??
          exact.presentations.find((p) => p.isDefault)?.id ??
          exact.presentations[0]?.id;
        if (!presentationId) return;
        if (exact.presentations.length === 1 || exact.matchedPresentationId) {
          tryAdd(exact, presentationId);
        } else {
          onNeedsPicker(exact);
        }
        setQ("");
        setResults([]);
        setOpen(false);
        return;
      }
      // Sin match exacto: si solo hay un resultado, abrir picker o agregar default
      if (data.results.length === 1) {
        const only = data.results[0]!;
        const def = only.presentations.find((p) => p.isDefault);
        if (only.presentations.length === 1 && def) {
          tryAdd(only, def.id);
          setQ("");
          setResults([]);
          setOpen(false);
        } else {
          onNeedsPicker(only);
        }
      }
    } catch {
      // ignore
    }
  }

  function handleResultClick(r: SearchResult) {
    if (r.presentations.length <= 1) {
      const presId = r.presentations[0]?.id;
      if (presId) tryAdd(r, presId);
    } else {
      // Picker se abre incluso sin stock — desde adentro la presentación
      // específica puede o no estar disponible. El validador del cobro vuelve a
      // checar contra Stock con FOR UPDATE.
      onNeedsPicker(r);
    }
    setQ("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleEnter();
            } else if (e.key === "Escape") {
              setQ("");
              setResults([]);
              setOpen(false);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Escanear código o buscar por SKU / nombre (Enter para agregar)..."
          className="h-12 pl-10 text-base"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[60vh] overflow-y-auto rounded-md border bg-popover shadow-lg">
          {q.trim().length < 2 ? null : results.length === 0 && !loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron productos.
            </div>
          ) : (
            <ul className="divide-y">
              {results.map((r) => {
                const localStock = stockOf(r);
                const noLocalStock = localStock <= 0;
                const hasOtherStores =
                  r.storeStock !== null && r.totalStock > r.storeStock;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => handleResultClick(r)}
                      disabled={noLocalStock && r.presentations.length === 1}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted",
                        noLocalStock &&
                          r.presentations.length === 1 &&
                          "cursor-not-allowed opacity-50",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground">
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.image}
                            alt=""
                            className="h-full w-full rounded object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium uppercase">
                          {r.name}
                        </p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{r.sku}</span>
                          {r.brand && (
                            <>
                              <span>·</span>
                              <span className="uppercase">{r.brand}</span>
                            </>
                          )}
                          {r.presentations.length > 1 && (
                            <>
                              <span>·</span>
                              <span>{r.presentations.length} presentaciones</span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-mono font-semibold">
                          {formatCurrency(r.salePrice)}
                        </p>
                        <p
                          className={cn(
                            "font-mono",
                            noLocalStock
                              ? "font-semibold text-destructive"
                              : "text-muted-foreground",
                          )}
                          title={
                            r.storeStock !== null
                              ? `Stock en tu sucursal · Total entre sucursales: ${r.totalStock}`
                              : undefined
                          }
                        >
                          {localStock} {r.unitSymbol}
                          {hasOtherStores && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              ({r.totalStock} total)
                            </span>
                          )}
                        </p>
                        {noLocalStock && (
                          <p className="text-[10px] text-destructive">
                            Sin stock local
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
