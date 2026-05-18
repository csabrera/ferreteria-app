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
import { UpperInput } from "@/components/ui/upper-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { storeSchema, type StoreInput } from "@/schemas/store.schema";
import { createStore, updateStore } from "@/server/actions/store.actions";
import type { StoreWithCounts } from "@/server/queries/store.queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreWithCounts | null;
};

export function StoreFormDialog({ open, onOpenChange, store }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = store !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      code: store?.code ?? "",
      name: store?.name ?? "",
      address: store?.address ?? "",
      phone: store?.phone ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: store?.code ?? "",
        name: store?.name ?? "",
        address: store?.address ?? "",
        phone: store?.phone ?? "",
      });
    }
  }, [open, store, reset]);

  function onSubmit(data: StoreInput) {
    startTransition(async () => {
      const result = editing
        ? await updateStore(store!.id, data)
        : await createStore(data);

      if (result.ok) {
        toast.success(editing ? "Sucursal actualizada" : "Sucursal creada");
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
            {editing ? "Editar sucursal" : "Nueva sucursal"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifica los datos de la sucursal."
              : 'Se creará automáticamente una "Caja 1" en esta sucursal.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="HCO-002"
                maxLength={20}
                className="font-mono uppercase"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <UpperInput
                id="name"
                placeholder="SUCURSAL NORTE"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Dirección <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <UpperInput
              id="address"
              placeholder="JR. DOS DE MAYO 123, HUÁNUCO"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Celular</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  id="phone"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              9 dígitos empezando con 9 (sin prefijo).
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
                "Crear sucursal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
