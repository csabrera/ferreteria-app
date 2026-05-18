"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Package, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ProductSearchResult = {
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
};

type Props = {
  id?: string;
  value: string | null;
  /** Datos del producto seleccionado (para mostrar label cuando hay value) */
  selectedLabel?: string | null;
  onChange: (id: string | null, product?: ProductSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Combobox que busca productos en /api/productos/search al escribir.
 * Debounce de 200ms para no spamear el servidor.
 */
export function ProductSearchCombobox({
  id,
  value,
  selectedLabel,
  onChange,
  placeholder = "Buscar producto...",
  disabled = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Debounced fetch
  React.useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/productos/search?q=${encodeURIComponent(query)}`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((data: { results: ProductSearchResult[] }) => {
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
  }, [query, open]);

  const displayLabel = selectedLabel
    ? selectedLabel
    : value
      ? "Producto seleccionado"
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className={cn("truncate", value && "uppercase")}>
            {displayLabel}
          </span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Limpiar"
                className="rounded hover:bg-muted"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[400px] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="SKU, código de barras o nombre (min. 2 letras)..."
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : query.trim().length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>No se encontraron productos.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onChange(p.id, p);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-start gap-2"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        value === p.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt=""
                          className="h-full w-full rounded object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium uppercase">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{p.sku}</span>
                        {p.brand && (
                          <>
                            <span>·</span>
                            <span className="uppercase">{p.brand}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-mono font-semibold">
                        S/ {p.salePrice.toFixed(2)}
                      </div>
                      <div className="text-muted-foreground">
                        {p.totalStock} {p.unitSymbol}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
