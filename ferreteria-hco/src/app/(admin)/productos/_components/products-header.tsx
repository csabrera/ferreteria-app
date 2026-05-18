"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryListItem } from "@/server/queries/category.queries";

import { ProductFormDialog } from "./product-form-dialog";

type BrandOption = { id: string; name: string };
type UnitOption = { id: string; code: string; name: string; symbol: string };

export function ProductsHeader({
  categories,
  brands,
  units,
}: {
  categories: CategoryListItem[];
  brands: BrandOption[];
  units: UnitOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Catálogo de productos. Cada producto puede tener varias presentaciones
            (unidad, caja, fardo, etc.).
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        productId={null}
        categories={categories}
        brands={brands}
        units={units}
      />
    </>
  );
}
