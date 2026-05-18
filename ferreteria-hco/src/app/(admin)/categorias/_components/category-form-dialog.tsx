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
import { CategoryTreeSelect } from "@/components/shared/category-tree-select";
import { categorySchema, type CategoryInput } from "@/schemas/category.schema";
import {
  createCategory,
  updateCategory,
} from "@/server/actions/category.actions";
import type { CategoryListItem } from "@/server/queries/category.queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryListItem | null;
  defaultParent: CategoryListItem | null;
  categories: CategoryListItem[];
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  defaultParent,
  categories,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = category !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      parentId: category?.parentId ?? defaultParent?.id ?? null,
      imageUrl: category?.imageUrl ?? null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? "",
        parentId: category?.parentId ?? defaultParent?.id ?? null,
        imageUrl: category?.imageUrl ?? null,
      });
    }
  }, [open, category, defaultParent, reset]);

  function onSubmit(data: CategoryInput) {
    startTransition(async () => {
      const result = editing
        ? await updateCategory(category!.id, data)
        : await createCategory(data);

      if (result.ok) {
        toast.success(editing ? "Categoría actualizada" : "Categoría creada");
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
            {editing ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifica los datos de la categoría. El slug se regenera si cambias el nombre."
              : "Crea una nueva categoría. Puede ser raíz o subcategoría de otra."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <UpperInput
              id="name"
              placeholder="CEMENTO"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Categoría padre</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <CategoryTreeSelect
                  id="parentId"
                  value={field.value}
                  onChange={field.onChange}
                  categories={categories}
                  excludeId={category?.id}
                  noneLabel="Sin categoría padre (raíz)"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Deja en "raíz" para crear una categoría de primer nivel.
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Imagen <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUploader
                  value={field.value ?? null}
                  onChange={field.onChange}
                  folder="categories"
                  label="Subir imagen"
                />
              )}
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
                  Guardando...
                </>
              ) : editing ? (
                "Guardar cambios"
              ) : (
                "Crear categoría"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
