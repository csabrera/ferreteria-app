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
import { UpperInput } from "@/components/ui/upper-input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/shared/image-uploader";
import { brandSchema, type BrandInput } from "@/schemas/brand.schema";
import { createBrand, updateBrand } from "@/server/actions/brand.actions";
import type { BrandListItem } from "@/server/queries/brand.queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: BrandListItem | null;
};

export function BrandFormDialog({ open, onOpenChange, brand }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = brand !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      logoUrl: brand?.logoUrl ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: brand?.name ?? "",
        logoUrl: brand?.logoUrl ?? null,
      });
    }
  }, [open, brand, reset]);

  function onSubmit(data: BrandInput) {
    startTransition(async () => {
      const result = editing
        ? await updateBrand(brand!.id, data)
        : await createBrand(data);

      if (result.ok) {
        toast.success(editing ? "Marca actualizada" : "Marca creada");
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
          <DialogTitle>{editing ? "Editar marca" : "Nueva marca"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifica el nombre o el logo de la marca."
              : "Registra una nueva marca de productos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <UpperInput
              id="name"
              placeholder="SODIMAC"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Logo <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Controller
              control={control}
              name="logoUrl"
              render={({ field }) => (
                <ImageUploader
                  value={field.value ?? null}
                  onChange={field.onChange}
                  folder="brands"
                  label="Subir logo"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP o SVG. Máximo 5MB.
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
                "Crear marca"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
