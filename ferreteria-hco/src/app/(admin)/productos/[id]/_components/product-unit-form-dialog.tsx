"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  productUnitSchema,
  type ProductUnitInput,
} from "@/schemas/product-unit.schema";
import {
  createProductUnit,
  updateProductUnit,
} from "@/server/actions/product-unit.actions";

type UnitOption = { id: string; code: string; name: string; symbol: string };

type ProductUnitData = {
  id: string;
  unitId: string;
  factor: number;
  salePrice: number;
  barcode: string | null;
  isDefault: boolean;
  unit: { id: string; code: string; name: string; symbol: string };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productUnit: ProductUnitData | null;
  baseUnitId: string;
  baseUnitSymbol: string;
  units: UnitOption[];
  /** IDs de unidades ya usadas por OTRAS presentaciones (a excluir del select) */
  existingUnitIds: string[];
};

export function ProductUnitFormDialog({
  open,
  onOpenChange,
  productId,
  productUnit,
  baseUnitId,
  baseUnitSymbol,
  units,
  existingUnitIds,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = productUnit !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductUnitInput>({
    resolver: zodResolver(productUnitSchema),
    defaultValues: {
      unitId: productUnit?.unitId ?? "",
      factor: productUnit?.factor ?? 1,
      salePrice: productUnit?.salePrice ?? 0,
      barcode: productUnit?.barcode ?? "",
      isDefault: productUnit?.isDefault ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        unitId: productUnit?.unitId ?? "",
        factor: productUnit?.factor ?? 1,
        salePrice: productUnit?.salePrice ?? 0,
        barcode: productUnit?.barcode ?? "",
        isDefault: productUnit?.isDefault ?? false,
      });
    }
  }, [open, productUnit, reset]);

  const currentUnitId = watch("unitId");
  const currentFactor = watch("factor");
  const selectedUnit = units.find((u) => u.id === currentUnitId);
  const isBaseUnit = currentUnitId === baseUnitId;

  const availableUnits: ComboboxOption[] = units
    .filter((u) => !existingUnitIds.includes(u.id))
    .map((u) => ({
      value: u.id,
      label: `${u.code} — ${u.name}`,
      keywords: u.symbol,
    }));

  function onSubmit(data: ProductUnitInput) {
    startTransition(async () => {
      const result = editing
        ? await updateProductUnit(productUnit!.id, data)
        : await createProductUnit(productId, data);

      if (result.ok) {
        toast.success(editing ? "Presentación actualizada" : "Presentación creada");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar presentación" : "Nueva presentación"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifica la presentación. La unidad base no se puede cambiar a otra presentación."
              : "Crea una presentación adicional (ej. caja×24). El factor indica cuántas unidades base contiene."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="unitId">Unidad</Label>
            <Controller
              control={control}
              name="unitId"
              render={({ field }) => (
                <Combobox
                  id="unitId"
                  options={availableUnits}
                  value={field.value || null}
                  onChange={(v) => field.onChange(v ?? "")}
                  placeholder="Selecciona unidad"
                  searchPlaceholder="Buscar..."
                />
              )}
            />
            {errors.unitId && (
              <p className="text-sm text-destructive">{errors.unitId.message}</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="factor">Factor de conversión</Label>
              <Input
                id="factor"
                type="number"
                step="0.0001"
                min={0.0001}
                placeholder="1"
                className="font-mono"
                {...register("factor")}
              />
              {currentFactor > 0 && selectedUnit && (
                <p className="text-xs text-muted-foreground">
                  1 {selectedUnit.symbol} = {currentFactor} {baseUnitSymbol}
                </p>
              )}
              {errors.factor && (
                <p className="text-sm text-destructive">{errors.factor.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="salePrice">
                Precio de venta <span className="text-xs text-muted-foreground">(S/)</span>
              </Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                className="font-mono"
                {...register("salePrice")}
              />
              {errors.salePrice && (
                <p className="text-sm text-destructive">{errors.salePrice.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="barcode">
              Código de barras{" "}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="barcode"
              placeholder="7501234567890"
              className="font-mono uppercase"
              maxLength={50}
              {...register("barcode")}
            />
            <p className="text-xs text-muted-foreground">
              Útil si cada presentación tiene su propio código (ej. caja vs unidad).
            </p>
            {errors.barcode && (
              <p className="text-sm text-destructive">{errors.barcode.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isDefault">Marcar como predeterminada</Label>
              <p className="text-xs text-muted-foreground">
                La predeterminada es la que aparece primero al vender en el POS.
              </p>
            </div>
            <Controller
              control={control}
              name="isDefault"
              render={({ field }) => (
                <Switch
                  id="isDefault"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {isBaseUnit && currentFactor !== 1 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              ⚠️ La unidad base normalmente tiene factor = 1. Verifica que el
              factor sea correcto.
            </p>
          )}

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
                  Guardando...
                </>
              ) : editing ? (
                "Guardar cambios"
              ) : (
                "Crear presentación"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
