"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { CategoryDualSelect } from "@/components/shared/category-dual-select";
import type { CategoryListItem } from "@/server/queries/category.queries";

type BrandOption = { id: string; name: string };

type Props = {
  categories: CategoryListItem[];
  brands: BrandOption[];
  initial: { search?: string; categoryId?: string; brandId?: string };
};

export function ProductFilters({ categories, brands, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Cualquier cambio de filtro resetea la paginación
      params.delete("page");
      router.push(`/productos${params.size ? "?" + params.toString() : ""}`);
    },
    [router, searchParams],
  );

  const hasFilters =
    !!initial.search || !!initial.categoryId || !!initial.brandId;

  const brandOptions: ComboboxOption[] = brands.map((b) => ({
    value: b.id,
    label: b.name.toUpperCase(),
  }));

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="SKU, código de barras o nombre..."
            className="pl-9"
            defaultValue={initial.search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("q", (e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>

        {/* Marca */}
        <div className="min-w-[220px]">
          <Combobox
            options={brandOptions}
            value={initial.brandId ?? null}
            onChange={(v) => updateParam("brandId", v)}
            placeholder="Todas las marcas"
            searchPlaceholder="Buscar marca..."
            uppercaseLabels
          />
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/productos")}
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Categoría + Subcategoría */}
      <CategoryDualSelect
        value={initial.categoryId ?? null}
        onChange={(v) => updateParam("categoryId", v)}
        categories={categories}
        mode="filter"
        idPrefix="filterCategory"
      />
    </div>
  );
}
