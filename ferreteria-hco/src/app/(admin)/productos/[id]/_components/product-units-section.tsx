"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatQuantity } from "@/lib/format";
import {
  deleteProductUnit,
  setDefaultProductUnit,
} from "@/server/actions/product-unit.actions";

import { ProductUnitFormDialog } from "./product-unit-form-dialog";

type UnitOption = { id: string; code: string; name: string; symbol: string };

type ProductUnit = {
  id: string;
  productId: string;
  unitId: string;
  factor: number;
  salePrice: number;
  barcode: string | null;
  isDefault: boolean;
  unit: { id: string; code: string; name: string; symbol: string };
};

type ProductDetail = {
  id: string;
  baseUnit: { id: string; code: string; name: string; symbol: string };
  productUnits: ProductUnit[];
};

type Props = {
  product: ProductDetail;
  units: UnitOption[];
};

export function ProductUnitsSection({ product, units }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ProductUnit | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(pu: ProductUnit) {
    setEditing(pu);
    setFormOpen(true);
  }

  function handleSetDefault(pu: ProductUnit) {
    if (pu.isDefault) return;
    startTransition(async () => {
      const r = await setDefaultProductUnit(pu.id);
      if (r.ok) {
        toast.success(`${pu.unit.code} marcada como predeterminada`);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function handleDelete(pu: ProductUnit) {
    if (!confirm(`¿Eliminar la presentación "${pu.unit.code}"?`)) return;
    startTransition(async () => {
      const r = await deleteProductUnit(pu.id);
      if (r.ok) {
        toast.success("Presentación eliminada");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Presentaciones</CardTitle>
            <CardDescription>
              Formas en que se vende el producto (unidad, caja, fardo, etc.). La
              <strong> predeterminada</strong> ★ es la que aparece primero en el POS.
            </CardDescription>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Nueva presentación
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">#</th>
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2">Unidad</th>
                  <th className="px-3 py-2 text-right">Factor</th>
                  <th className="px-3 py-2">Equivalencia</th>
                  <th className="px-3 py-2 text-right">Precio venta</th>
                  <th className="px-3 py-2">Código barras</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {product.productUnits.map((pu, idx) => (
                  <tr key={pu.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleSetDefault(pu)}
                        disabled={isPending || pu.isDefault}
                        title={
                          pu.isDefault
                            ? "Predeterminada"
                            : "Marcar como predeterminada"
                        }
                        className="text-amber-500 disabled:cursor-default"
                      >
                        <Star
                          className={`h-4 w-4 ${pu.isDefault ? "fill-amber-500" : "opacity-30 hover:opacity-100"}`}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-mono font-medium">{pu.unit.code}</div>
                      <div className="text-xs uppercase text-muted-foreground">
                        {pu.unit.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatQuantity(pu.factor)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      1 {pu.unit.symbol} = {formatQuantity(pu.factor)}{" "}
                      {product.baseUnit.symbol}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(pu.salePrice)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {pu.barcode ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(pu)}
                          disabled={isPending}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pu)}
                          disabled={isPending || pu.isDefault}
                          title={
                            pu.isDefault
                              ? "No puedes eliminar la predeterminada"
                              : "Eliminar"
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ProductUnitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        productId={product.id}
        productUnit={editing}
        baseUnitId={product.baseUnit.id}
        baseUnitSymbol={product.baseUnit.symbol}
        units={units}
        existingUnitIds={product.productUnits
          .filter((pu) => pu.id !== editing?.id)
          .map((pu) => pu.unitId)}
      />
    </>
  );
}
