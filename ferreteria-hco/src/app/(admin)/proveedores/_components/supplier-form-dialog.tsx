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
import { RucInput } from "@/components/ui/ruc-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supplierSchema, type SupplierInput } from "@/schemas/supplier.schema";
import {
  createSupplier,
  updateSupplier,
} from "@/server/actions/supplier.actions";
import type { SupplierListItem } from "@/server/queries/supplier.queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierListItem | null;
};

export function SupplierFormDialog({ open, onOpenChange, supplier }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = supplier !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      ruc: supplier?.ruc ?? "",
      businessName: supplier?.businessName ?? "",
      contactName: supplier?.contactName ?? "",
      phone: supplier?.phone ?? "",
      email: supplier?.email ?? "",
      address: supplier?.address ?? "",
      notes: supplier?.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        ruc: supplier?.ruc ?? "",
        businessName: supplier?.businessName ?? "",
        contactName: supplier?.contactName ?? "",
        phone: supplier?.phone ?? "",
        email: supplier?.email ?? "",
        address: supplier?.address ?? "",
        notes: supplier?.notes ?? "",
      });
    }
  }, [open, supplier, reset]);

  function onSubmit(data: SupplierInput) {
    startTransition(async () => {
      const result = editing
        ? await updateSupplier(supplier!.id, data)
        : await createSupplier(data);

      if (result.ok) {
        toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
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
            {editing ? "Editar proveedor" : "Nuevo proveedor"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifica los datos del proveedor."
              : "Registra un nuevo proveedor. El RUC debe ser único."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <div className="space-y-1">
              <Label htmlFor="ruc">RUC</Label>
              <Controller
                control={control}
                name="ruc"
                render={({ field }) => (
                  <RucInput
                    id="ruc"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.ruc && (
                <p className="text-sm text-destructive">{errors.ruc.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="businessName">Razón social</Label>
              <UpperInput
                id="businessName"
                placeholder="CEMENTOS PACASMAYO S.A.A."
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive">{errors.businessName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="contactName">
              Nombre del contacto{" "}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <UpperInput
              id="contactName"
              placeholder="JUAN PÉREZ — VENDEDOR"
              {...register("contactName")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
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
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">
                Email <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ventas@proveedor.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Dirección</Label>
            <UpperInput
              id="address"
              placeholder="AV. ARGENTINA 123, LIMA"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">
              Notas internas{" "}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Días de pago, horario de atención, etc."
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
                  Guardando...
                </>
              ) : editing ? (
                "Guardar cambios"
              ) : (
                "Crear proveedor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
