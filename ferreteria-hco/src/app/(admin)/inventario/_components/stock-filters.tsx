"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CategoryDualSelect } from "@/components/shared/category-dual-select";
import type { CategoryListItem } from "@/server/queries/category.queries";

type Store = { id: string; code: string; name: string };
type BrandOption = { id: string; name: string };

type Props = {
  stores: Store[];
  categories: CategoryListItem[];
  brands: BrandOption[];
  initial: {
    search?: string;
    storeId?: string;
    categoryId?: string;
    brandId?: string;
    critical?: boolean;
  };
};

export function StockFilters({ stores, categories, brands, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`/inventario${params.size ? "?" + params.toString() : ""}`);
    },
    [router, searchParams],
  );

  const hasFilters =
    !!initial.search ||
    !!initial.storeId ||
    !!initial.categoryId ||
    !!initial.brandId ||
    !!initial.critical;

  const storeOptions: ComboboxOption[] = stores.map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name.toUpperCase()}`,
    keywords: s.code,
  }));

  const brandOptions: ComboboxOption[] = brands.map((b) => ({
    value: b.id,
    label: b.name.toUpperCase(),
  }));

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="SKU, código o nombre..."
            className="pl-9"
            defaultValue={initial.search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                update("q", (e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>

        <div className="min-w-[220px]">
          <Combobox
            options={storeOptions}
            value={initial.storeId ?? null}
            onChange={(v) => update("storeId", v)}
            placeholder="Todas las sucursales"
            searchPlaceholder="Buscar sucursal..."
          />
        </div>

        <div className="min-w-[200px]">
          <Combobox
            options={brandOptions}
            value={initial.brandId ?? null}
            onChange={(v) => update("brandId", v)}
            placeholder="Todas las marcas"
            searchPlaceholder="Buscar marca..."
            uppercaseLabels
          />
        </div>

        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
          <Switch
            id="critical"
            checked={!!initial.critical}
            onCheckedChange={(checked) => update("critical", checked ? "1" : null)}
          />
          <Label htmlFor="critical" className="cursor-pointer text-sm">
            Solo stock crítico
          </Label>
        </div>

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/inventario")}
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <CategoryDualSelect
        value={initial.categoryId ?? null}
        onChange={(v) => update("categoryId", v)}
        categories={categories}
        mode="filter"
        idPrefix="invCat"
      />
    </div>
  );
}
