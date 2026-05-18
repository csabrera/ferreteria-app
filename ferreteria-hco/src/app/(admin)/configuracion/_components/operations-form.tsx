"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  operationsSchema,
  type OperationsInput,
} from "@/schemas/settings.schema";
import { updateOperations } from "@/server/actions/settings.actions";
import type { AppSettingsData } from "@/server/queries/settings.queries";

import { SectionCard } from "./section-card";

export function OperationsForm({ settings }: { settings: AppSettingsData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OperationsInput>({
    resolver: zodResolver(operationsSchema),
    defaultValues: {
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      igvPercent: settings.igvPercent,
      timezone: settings.timezone,
      defaultMinStock: settings.defaultMinStock,
    },
  });

  function onSubmit(data: OperationsInput) {
    startTransition(async () => {
      const result = await updateOperations(data);
      if (result.ok) {
        toast.success("Parámetros operativos actualizados");
        reset(data);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <SectionCard
      title="Parámetros operativos"
      description="Moneda, IGV, zona horaria y defaults del sistema."
      isPending={isPending}
      isDirty={isDirty}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency">Código de moneda</Label>
          <Input
            id="currency"
            placeholder="PEN"
            maxLength={5}
            className="uppercase"
            {...register("currency")}
          />
          {errors.currency && (
            <p className="text-sm text-destructive">{errors.currency.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencySymbol">Símbolo</Label>
          <Input
            id="currencySymbol"
            placeholder="S/"
            maxLength={3}
            {...register("currencySymbol")}
          />
          {errors.currencySymbol && (
            <p className="text-sm text-destructive">{errors.currencySymbol.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="igvPercent">IGV (%)</Label>
          <Input
            id="igvPercent"
            type="number"
            step="0.01"
            min={0}
            max={100}
            placeholder="18"
            {...register("igvPercent")}
          />
          {errors.igvPercent && (
            <p className="text-sm text-destructive">{errors.igvPercent.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultMinStock">Stock mínimo por defecto</Label>
          <Input
            id="defaultMinStock"
            type="number"
            step="0.001"
            min={0}
            placeholder="5"
            {...register("defaultMinStock")}
          />
          {errors.defaultMinStock && (
            <p className="text-sm text-destructive">{errors.defaultMinStock.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input
            id="timezone"
            placeholder="America/Lima"
            {...register("timezone")}
          />
          {errors.timezone && (
            <p className="text-sm text-destructive">{errors.timezone.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Formato IANA. Para Perú: <code>America/Lima</code>.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
