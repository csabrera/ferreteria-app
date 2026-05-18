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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addCashMovementSchema,
  type AddCashMovementInput,
} from "@/schemas/cash.schema";
import { addCashMovement } from "@/server/actions/cash.actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TYPE_OPTIONS: { value: AddCashMovementInput["type"]; label: string; help: string }[] = [
  { value: "INCOME", label: "Ingreso", help: "Entra dinero a la caja (no venta)" },
  { value: "EXPENSE", label: "Gasto", help: "Sale dinero por un gasto menor" },
  { value: "WITHDRAWAL", label: "Retiro", help: "Sacas efectivo de la caja" },
  { value: "DEPOSIT", label: "Depósito", help: "Ingresas más fondo a la caja" },
];

export function AddMovementDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddCashMovementInput>({
    resolver: zodResolver(addCashMovementSchema),
    defaultValues: {
      type: "INCOME",
      amount: 0,
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ type: "INCOME", amount: 0, description: "" });
    }
  }, [open, reset]);

  function onSubmit(data: AddCashMovementInput) {
    startTransition(async () => {
      const result = await addCashMovement(data);
      if (result.ok) {
        toast.success("Movimiento registrado");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento de caja</DialogTitle>
          <DialogDescription>
            Registra un ingreso, gasto, retiro o depósito manual. Las ventas se
            registran automáticamente desde el POS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="type">Tipo</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {opt.help}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount">Monto (S/)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              placeholder="20.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Motivo</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Ej. compra de stretch film para envolver pedido"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
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
              ) : (
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
