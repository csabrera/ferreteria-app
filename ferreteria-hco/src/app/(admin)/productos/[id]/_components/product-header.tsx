"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Package, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { toggleProductActive } from "@/server/actions/product.actions";
import { ProductFormDialog } from "@/app/(admin)/productos/_components/product-form-dialog";
import type { CategoryListItem } from "@/server/queries/category.queries";

type ProductDetail = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  images: string[];
  costPrice: number;
  salePrice: number;
  isActive: boolean;
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
  baseUnit: { id: string; code: string; name: string; symbol: string };
};

type BrandOption = { id: string; name: string };
type UnitOption = { id: string; code: string; name: string; symbol: string };

type Props = {
  product: ProductDetail;
  categories: CategoryListItem[];
  brands: BrandOption[];
  units: UnitOption[];
};

export function ProductHeader({ product, categories, brands, units }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  function handleToggle() {
    toggleProductActive(product.id).then((r) => {
      if (r.ok) {
        toast.success(product.isActive ? "Producto desactivado" : "Producto activado");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <>
      <div className="grid gap-6 rounded-lg border bg-card p-6 md:grid-cols-[200px_1fr]">
        {/* Imagen principal */}
        <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="200px"
              className="object-contain"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Package className="h-12 w-12" />
            </div>
          )}
        </div>

        {/* Datos */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span>{product.sku}</span>
                {product.barcode && (
                  <>
                    <span>·</span>
                    <span>{product.barcode}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold uppercase leading-tight">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-sm uppercase text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={product.isActive ? "success" : "secondary"}>
                {product.isActive ? "Activo" : "Inactivo"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                title={product.isActive ? "Desactivar" : "Activar"}
              >
                {product.isActive ? (
                  <PowerOff className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <Power className="h-3.5 w-3.5 text-emerald-600" />
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <Field label="Categoría" value={product.category.name.toUpperCase()} />
            <Field
              label="Marca"
              value={product.brand?.name.toUpperCase() ?? "—"}
            />
            <Field label="Unidad base" value={product.baseUnit.code} />
            <Field
              label="Costo promedio"
              value={formatCurrency(product.costPrice)}
              mono
            />
            <Field
              label="Precio venta"
              value={formatCurrency(product.salePrice)}
              mono
              highlight
            />
          </div>
        </div>
      </div>

      <ProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        productId={product.id}
        categories={categories}
        brands={brands}
        units={units}
      />
    </>
  );
}

function Field({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 text-sm ${mono ? "font-mono" : ""} ${highlight ? "text-base font-semibold" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
