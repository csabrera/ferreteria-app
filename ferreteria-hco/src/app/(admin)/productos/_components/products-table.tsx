"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Power, PowerOff, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { formatCurrency, formatQuantity } from "@/lib/format";
import type { ProductListItem } from "@/server/queries/product.queries";
import { toggleProductActive } from "@/server/actions/product.actions";
import type { CategoryListItem } from "@/server/queries/category.queries";

import { ProductFormDialog } from "./product-form-dialog";

type BrandOption = { id: string; name: string };
type UnitOption = { id: string; code: string; name: string; symbol: string };

type Props = {
  products: ProductListItem[];
  categories: CategoryListItem[];
  brands: BrandOption[];
  units: UnitOption[];
  /** Índice global de la primera fila (para numeración paginada). */
  startIndex?: number;
};

export function ProductsTable({ products, categories, brands, units, startIndex = 0 }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function handleToggle(product: ProductListItem) {
    startTransition(async () => {
      const result = await toggleProductActive(product.id);
      if (result.ok) {
        toast.success(
          product.isActive ? "Producto desactivado" : "Producto activado",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function openEdit(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 w-12 text-center">#</th>
              <th className="px-3 py-3 w-12">Img</th>
              <th className="px-3 py-3">SKU / Código</th>
              <th className="px-3 py-3">Producto</th>
              <th className="px-3 py-3">Categoría</th>
              <th className="px-3 py-3">Marca</th>
              <th className="px-3 py-3 text-right">Costo prom.</th>
              <th className="px-3 py-3 text-right">Venta</th>
              <th className="px-3 py-3 text-right">Stock</th>
              <th className="px-3 py-3 text-center">Estado</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="py-12 text-center text-muted-foreground"
                >
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              products.map((p, idx) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                    {startIndex + idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    {p.images[0] ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded border bg-muted">
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs font-medium">{p.sku}</div>
                    {p.barcode && (
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {p.barcode}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 uppercase">
                    <Link
                      href={`/productos/${p.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      por {p.baseUnit.code}
                    </div>
                  </td>
                  <td className="px-3 py-2 uppercase text-muted-foreground">
                    {p.category.name}
                  </td>
                  <td className="px-3 py-2 uppercase text-muted-foreground">
                    {p.brand?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrency(p.costPrice)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {formatCurrency(p.salePrice)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-mono">
                      {p.hasCriticalStock && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-amber-500"
                          aria-label="Stock crítico"
                        />
                      )}
                      <span
                        className={p.hasCriticalStock ? "text-amber-600 font-semibold" : ""}
                      >
                        {formatQuantity(p.totalStock)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.baseUnit.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={p.isActive ? "success" : "secondary"}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/productos/${p.id}`}>
                            <Package />
                            Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(p.id)}>
                          <Pencil />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => handleToggle(p)}
                          disabled={isPending}
                          className={
                            p.isActive
                              ? "text-destructive focus:text-destructive"
                              : "text-emerald-600 focus:text-emerald-600"
                          }
                        >
                          {p.isActive ? (
                            <>
                              <PowerOff />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Power />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        productId={editingId}
        categories={categories}
        brands={brands}
        units={units}
      />
    </>
  );
}
