"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  openCashSessionSchema,
  type OpenCashSessionInput,
} from "@/schemas/cash.schema";
import { openCashSession } from "@/server/actions/cash.actions";

type RegisterOption = {
  id: string;
  name: string;
  storeCode: string;
  storeName: string;
  isOpenByOther: boolean;
  openedBy: string | null;
};

export function OpenCashForm({ registers }: { registers: RegisterOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const availableRegisters = registers.filter((r) => !r.isOpenByOther);
  const onlyOne = availableRegisters.length === 1;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<OpenCashSessionInput>({
    resolver: zodResolver(openCashSessionSchema),
    defaultValues: {
      cashRegisterId: onlyOne ? availableRegisters[0]!.id : "",
      openingAmount: 0,
      notes: "",
    },
  });

  // Auto-seleccionar si tras render queda una sola caja disponible
  useEffect(() => {
    if (onlyOne && availableRegisters[0]) {
      setValue("cashRegisterId", availableRegisters[0].id);
    }
  }, [onlyOne, availableRegisters, setValue]);

  function onSubmit(data: OpenCashSessionInput) {
    startTransition(async () => {
      const result = await openCashSession(data);
      if (result.ok) {
        toast.success("Caja abierta");
        router.push("/caja/movimientos");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (registers.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No hay cajas registradas en tu sucursal. Pide a un administrador que
          cree una en <span className="font-mono">/sucursales</span>.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wallet className="h-5 w-5" />
          Apertura de turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="cashRegisterId">Caja</Label>
            <Controller
              control={control}
              name="cashRegisterId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={onlyOne}
                >
                  <SelectTrigger id="cashRegisterId">
                    <SelectValue placeholder="Selecciona una caja" />
                  </SelectTrigger>
                  <SelectContent>
                    {registers.map((r) => (
                      <SelectItem
                        key={r.id}
                        value={r.id}
                        disabled={r.isOpenByOther}
                      >
                        <span className="uppercase">
                          {r.name} — {r.storeCode}
                        </span>
                        {r.isOpenByOther && r.openedBy && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (abierta por {r.openedBy.toUpperCase()})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cashRegisterId && (
              <p className="text-sm text-destructive">
                {errors.cashRegisterId.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="openingAmount">
              Monto inicial (S/){" "}
              <span className="text-xs text-muted-foreground">
                — efectivo en caja al iniciar
              </span>
            </Label>
            <Input
              id="openingAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="50.00"
              {...register("openingAmount")}
            />
            {errors.openingAmount && (
              <p className="text-sm text-destructive">
                {errors.openingAmount.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">
              Notas{" "}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Observaciones de la apertura"
              {...register("notes")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abriendo...
              </>
            ) : (
              "Abrir caja"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
