"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  closeCashSessionSchema,
  type CloseCashSessionInput,
} from "@/schemas/cash.schema";
import { closeCashSession } from "@/server/actions/cash.actions";

type Props = {
  opening: number;
  totalIn: number;
  totalOut: number;
  expected: number;
  movementsCount: number;
  cashRegisterLabel: string;
};

export function CloseCashForm({
  opening,
  totalIn,
  totalOut,
  expected,
  movementsCount,
  cashRegisterLabel,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CloseCashSessionInput>({
    resolver: zodResolver(closeCashSessionSchema),
    defaultValues: {
      countedAmount: 0,
      notes: "",
    },
  });

  const counted = useWatch({ control, name: "countedAmount" }) ?? 0;
  const countedNum = Number(counted) || 0;
  const difference = +(countedNum - expected).toFixed(2);

  let diffState: "neutral" | "ok" | "warn" = "neutral";
  if (countedNum > 0) {
    diffState = Math.abs(difference) < 0.01 ? "ok" : "warn";
  }

  function onSubmit(data: CloseCashSessionInput) {
    startTransition(async () => {
      const result = await closeCashSession(data);
      if (result.ok) {
        const diff = result.data?.difference ?? 0;
        if (Math.abs(diff) < 0.01) {
          toast.success("Caja cerrada sin diferencia");
        } else {
          toast.warning(
            `Caja cerrada con diferencia de ${formatCurrency(diff)}`,
          );
        }
        router.push("/pos");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <p className="font-medium uppercase">{cashRegisterLabel}</p>
          <p className="text-xs text-muted-foreground">
            {movementsCount} movimientos en el turno
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Row label="Monto inicial" value={formatCurrency(opening)} />
          <Row
            label="Ingresos"
            value={`+${formatCurrency(totalIn)}`}
            color="text-emerald-600"
          />
          <Row
            label="Salidas"
            value={`−${formatCurrency(totalOut)}`}
            color="text-destructive"
          />
          <Row
            label="Saldo esperado"
            value={formatCurrency(expected)}
            bold
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="countedAmount">
              Monto contado (S/){" "}
              <span className="text-xs text-muted-foreground">
                — efectivo físico en caja
              </span>
            </Label>
            <Input
              id="countedAmount"
              type="number"
              step="0.01"
              min="0"
              autoFocus
              placeholder="0.00"
              {...register("countedAmount")}
            />
            {errors.countedAmount && (
              <p className="text-sm text-destructive">
                {errors.countedAmount.message}
              </p>
            )}
          </div>

          {countedNum > 0 && (
            <Alert
              variant={diffState === "warn" ? "destructive" : "default"}
              className={
                diffState === "ok" ? "border-emerald-500/30 bg-emerald-50" : ""
              }
            >
              {diffState === "ok" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="font-mono">
                {diffState === "ok" ? (
                  <>Cuadra exactamente con el saldo esperado.</>
                ) : (
                  <>
                    Diferencia:{" "}
                    <strong>
                      {difference > 0 ? "+" : ""}
                      {formatCurrency(difference)}
                    </strong>{" "}
                    {difference > 0 ? "(sobra)" : "(falta)"}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label htmlFor="notes">
              Observaciones{" "}
              <span className="text-xs text-muted-foreground">
                {diffState === "warn"
                  ? "(recomendado si hay diferencia)"
                  : "(opcional)"}
              </span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Ej. faltante porque presté efectivo al delivery"
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/caja/movimientos")}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                "Cerrar caja"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <>
      <div className="text-muted-foreground">{label}</div>
      <div
        className={`text-right font-mono ${color ?? ""} ${bold ? "font-bold" : ""}`}
      >
        {value}
      </div>
    </>
  );
}
