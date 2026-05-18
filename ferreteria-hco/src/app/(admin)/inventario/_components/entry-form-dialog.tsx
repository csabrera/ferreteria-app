"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UpperInput } from "@/components/ui/upper-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  ProductSearchCombobox,
  type ProductSearchResult,
} from "@/components/shared/product-search-combobox";
import {
  inventoryEntrySchema,
  type InventoryEntryInput,
} from "@/schemas/inventory.schema";
import { createInventoryEntry } from "@/server/actions/inventory.actions";
import { formatCurrency } from "@/lib/format";

type Store = { id: string; code: string; name: string };
type Supplier = { id: string; ruc: string; businessName: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
  suppliers: Supplier[];
};

type ProductInfo = { name: string; currentSalePrice: number };

export function EntryFormDialog({ open, onOpenChange, stores, suppliers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Cache de info de productos seleccionados (id → name + precio actual)
  const [productInfo, setProductInfo] = useState<Map<string, ProductInfo>>(
    new Map(),
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<InventoryEntryInput>({
    resolver: zodResolver(inventoryEntrySchema),
    defaultValues: {
      storeId: stores[0]?.id ?? "",
      supplierId: "",
      reference: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitCost: 0, newSalePrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (open) {
      reset({
        storeId: stores[0]?.id ?? "",
        supplierId: "",
        reference: "",
        notes: "",
        items: [{ productId: "", quantity: 1, unitCost: 0, newSalePrice: 0 }],
      });
      setProductInfo(new Map());
    }
  }, [open, stores, reset]);

  const items = watch("items");
  const totalAmount = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0,
  );

  function onSubmit(data: InventoryEntryInput) {
    startTransition(async () => {
      const result = await createInventoryEntry(data);
      if (result.ok) {
        toast.success(
          `Entrada registrada · ${result.data?.movementsCreated} movimiento(s)`,
        );
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const storeOptions: ComboboxOption[] = stores.map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name.toUpperCase()}`,
    keywords: s.code,
  }));

  const supplierOptions: ComboboxOption[] = suppliers.map((s) => ({
    value: s.id,
    label: `${s.ruc} · ${s.businessName.toUpperCase()}`,
    keywords: s.ruc,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva entrada de mercadería</DialogTitle>
          <DialogDescription>
            Registra productos que ingresan a una sucursal. Se actualiza el stock,
            el costo promedio del producto y queda asentado en el kardex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cabecera */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="storeId">Sucursal de destino</Label>
              <Controller
                control={control}
                name="storeId"
                render={({ field }) => (
                  <Combobox
                    id="storeId"
                    options={storeOptions}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="Selecciona sucursal"
                    searchPlaceholder="Buscar..."
                    clearable={false}
                  />
                )}
              />
              {errors.storeId && (
                <p className="text-sm text-destructive">{errors.storeId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="supplierId">Proveedor</Label>
              <Controller
                control={control}
                name="supplierId"
                render={({ field }) => (
                  <Combobox
                    id="supplierId"
                    options={supplierOptions}
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? "")}
                    placeholder="Selecciona proveedor"
                    searchPlaceholder="Buscar por RUC o razón social..."
                    clearable={false}
                  />
                )}
              />
              {errors.supplierId && (
                <p className="text-sm text-destructive">{errors.supplierId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reference">
              Referencia{" "}
              <span className="text-xs text-muted-foreground">
                (nº orden de compra, guía, factura, etc.) — opcional
              </span>
            </Label>
            <UpperInput
              id="reference"
              placeholder="OC-2026-001"
              maxLength={100}
              {...register("reference")}
            />
          </div>

          {/* Líneas */}
          <div className="space-y-2">
            <Label>Productos</Label>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2">Producto</th>
                    <th className="px-2 py-2 w-24 text-right">Cantidad</th>
                    <th className="px-2 py-2 w-28 text-right">Costo compra</th>
                    <th className="px-2 py-2 w-28 text-right">Precio venta</th>
                    <th className="px-2 py-2 w-28 text-right">Subtotal</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((field, idx) => {
                    const qty = Number(items[idx]?.quantity ?? 0);
                    const cost = Number(items[idx]?.unitCost ?? 0);
                    const subtotal = qty * cost;
                    const productId = items[idx]?.productId;
                    const info = productId ? productInfo.get(productId) : null;
                    const currentPrice = info?.currentSalePrice ?? 0;
                    const newPrice = Number(items[idx]?.newSalePrice ?? 0);
                    const priceChanged =
                      !!info && newPrice > 0 && newPrice !== currentPrice;
                    return (
                      <tr key={field.id} className="align-top">
                        <td className="p-2">
                          <Controller
                            control={control}
                            name={`items.${idx}.productId`}
                            render={({ field: f }) => (
                              <ProductSearchCombobox
                                value={f.value || null}
                                selectedLabel={
                                  f.value ? productInfo.get(f.value)?.name ?? null : null
                                }
                                onChange={(id, product) => {
                                  f.onChange(id ?? "");
                                  if (product) {
                                    setProductInfo((prev) => {
                                      const next = new Map(prev);
                                      next.set(product.id, {
                                        name: product.name,
                                        currentSalePrice: product.salePrice,
                                      });
                                      return next;
                                    });
                                    // Autocompletar el precio de venta con el actual del producto
                                    setValue(
                                      `items.${idx}.newSalePrice`,
                                      product.salePrice,
                                      { shouldValidate: false },
                                    );
                                  }
                                }}
                              />
                            )}
                          />
                          {errors.items?.[idx]?.productId && (
                            <p className="mt-1 text-xs text-destructive">
                              {errors.items[idx]?.productId?.message}
                            </p>
                          )}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.001"
                            min={0.001}
                            placeholder="1"
                            className="text-right font-mono"
                            {...register(`items.${idx}.quantity`)}
                          />
                          {errors.items?.[idx]?.quantity && (
                            <p className="mt-1 text-xs text-destructive">
                              {errors.items[idx]?.quantity?.message}
                            </p>
                          )}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0.00"
                            className="text-right font-mono"
                            {...register(`items.${idx}.unitCost`)}
                          />
                          {errors.items?.[idx]?.unitCost && (
                            <p className="mt-1 text-xs text-destructive">
                              {errors.items[idx]?.unitCost?.message}
                            </p>
                          )}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="0.00"
                            className="text-right font-mono"
                            {...register(`items.${idx}.newSalePrice`)}
                          />
                          {priceChanged && (
                            <p className="mt-1 text-xs text-amber-600">
                              Cambio: S/.{currentPrice.toFixed(2)} →{" "}
                              S/.{newPrice.toFixed(2)}
                            </p>
                          )}
                          {errors.items?.[idx]?.newSalePrice && (
                            <p className="mt-1 text-xs text-destructive">
                              {errors.items[idx]?.newSalePrice?.message}
                            </p>
                          )}
                        </td>
                        <td className="p-2 pt-4 text-right font-mono text-sm">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="p-2 pt-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(idx)}
                            disabled={fields.length === 1}
                            title={
                              fields.length === 1
                                ? "Debe quedar al menos 1 línea"
                                : "Quitar línea"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/30 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-2 py-2 text-right">
                      Total compra:
                    </td>
                    <td className="px-2 py-2 text-right font-mono">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: "", quantity: 1, unitCost: 0, newSalePrice: 0 })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Agregar línea
            </Button>
            {errors.items?.message && (
              <p className="text-sm text-destructive">{errors.items.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label htmlFor="notes">
              Notas <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Observaciones de la entrada..."
              className="uppercase"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cerrar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar entrada"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
