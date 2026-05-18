"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/shared/image-uploader";
import { CategoryDualSelect } from "@/components/shared/category-dual-select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { productSchema, type ProductInput } from "@/schemas/product.schema";
import {
  createProduct,
  updateProduct,
} from "@/server/actions/product.actions";
import type { CategoryListItem } from "@/server/queries/category.queries";

type BrandOption = { id: string; name: string };
type UnitOption = { id: string; code: string; name: string; symbol: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  categories: CategoryListItem[];
  brands: BrandOption[];
  units: UnitOption[];
};

type ProductInitial = {
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  brandId: string | null;
  baseUnitId: string;
  images: string[];
  salePrice: number;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  productId,
  categories,
  brands,
  units,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [initial, setInitial] = useState<ProductInitial | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const editing = productId !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      barcode: "",
      name: "",
      description: "",
      categoryId: "",
      brandId: null,
      baseUnitId: units[0]?.id ?? "",
      images: [],
      salePrice: 0,
    },
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (!open) return;

    if (!productId) {
      setInitial(null);
      reset({
        sku: "",
        barcode: "",
        name: "",
        description: "",
        categoryId: "",
        brandId: null,
        baseUnitId: units[0]?.id ?? "",
        images: [],
        salePrice: 0,
      });
      return;
    }

    setIsLoading(true);
    fetch(`/api/productos/${productId}`)
      .then((r) => r.json())
      .then((data: ProductInitial) => {
        setInitial(data);
        reset({
          sku: data.sku,
          barcode: data.barcode ?? "",
          name: data.name,
          description: data.description ?? "",
          categoryId: data.categoryId,
          brandId: data.brandId,
          baseUnitId: data.baseUnitId,
          images: data.images,
          salePrice: data.salePrice,
        });
      })
      .catch(() => toast.error("No se pudo cargar el producto"))
      .finally(() => setIsLoading(false));
  }, [open, productId, units, reset]);

  function onSubmit(data: ProductInput) {
    startTransition(async () => {
      const result = editing
        ? await updateProduct(productId!, data)
        : await createProduct(data);

      if (result.ok) {
        if (!editing && result.data) {
          toast.success(`Producto creado · SKU: ${result.data.sku}`);
        } else {
          toast.success("Producto actualizado");
        }
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifica los datos del producto. Las presentaciones (caja×N, etc.) se gestionan en el detalle."
              : 'Al crear, se generará automáticamente la presentación base (1 unidad). Otras presentaciones se agregan luego en el detalle del producto.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Identificación */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="sku">
                  SKU{" "}
                  {!editing && (
                    <span className="text-xs text-muted-foreground">
                      (déjalo vacío para generar automático)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="sku"
                    placeholder={editing ? undefined : "PRD-000001 (auto)"}
                    className="font-mono uppercase"
                    maxLength={50}
                    {...register("sku")}
                  />
                  {!editing && (
                    <Sparkles className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>
                {errors.sku && (
                  <p className="text-sm text-destructive">{errors.sku.message}</p>
                )}
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
                {errors.barcode && (
                  <p className="text-sm text-destructive">{errors.barcode.message}</p>
                )}
              </div>
            </div>

            {/* Nombre y descripción */}
            <div className="space-y-1">
              <Label htmlFor="name">Nombre del producto</Label>
              <UpperInput
                id="name"
                placeholder="CEMENTO SOL TIPO I X 42.5 KG"
                autoFocus={!editing}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">
                Descripción <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="Cemento Portland Tipo I de uso general"
                className="uppercase"
                {...register("description")}
              />
            </div>

            {/* Clasificación: categoría (raíz + sub dependientes) */}
            <div className="space-y-1">
              <Label>Categoría · Subcategoría</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <CategoryDualSelect
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? "")}
                    categories={categories}
                    mode="form"
                    idPrefix="productCategory"
                  />
                )}
              />
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Marca */}
            <div className="space-y-1">
              <Label htmlFor="brandId">
                Marca <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Controller
                control={control}
                name="brandId"
                render={({ field }) => (
                  <Combobox
                    id="brandId"
                    options={brands.map<ComboboxOption>((b) => ({
                      value: b.id,
                      label: b.name.toUpperCase(),
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sin marca"
                    searchPlaceholder="Buscar marca..."
                    uppercaseLabels
                  />
                )}
              />
            </div>

            {/* Unidad base y precio de venta */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="baseUnitId">Unidad base</Label>
                <Controller
                  control={control}
                  name="baseUnitId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="baseUnitId">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <span className="font-mono">{u.code}</span> — {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.baseUnitId && (
                  <p className="text-sm text-destructive">{errors.baseUnitId.message}</p>
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

            <p className="text-xs text-muted-foreground">
              💡 El <strong>costo de compra</strong> del producto se calcula
              automáticamente al registrar entradas de mercadería (promedio
              ponderado).
            </p>

            {/* Imagen principal */}
            <div className="space-y-1">
              <Label>
                Imagen principal{" "}
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Controller
                control={control}
                name="images"
                render={({ field }) => (
                  <ImageUploader
                    value={field.value[0] ?? null}
                    onChange={(url) => field.onChange(url ? [url] : [])}
                    folder="products"
                    label="Subir imagen"
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                Para múltiples imágenes, accede al detalle del producto.
              </p>
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
                    Guardando...
                  </>
                ) : editing ? (
                  "Guardar cambios"
                ) : (
                  "Crear producto"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
