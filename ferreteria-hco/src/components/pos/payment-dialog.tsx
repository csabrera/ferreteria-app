"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethodOption } from "@/server/queries/payment-method.queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  methods: PaymentMethodOption[];
  isPending: boolean;
  onConfirm: (payment: {
    paymentMethodId: string;
    amount: number;
    reference: string;
  }) => void;
};

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  methods,
  isPending,
  onConfirm,
}: Props) {
  // Default: CASH si está disponible, sino el primero
  const defaultMethodId = useMemo(() => {
    return methods.find((m) => m.code === "CASH")?.id ?? methods[0]?.id ?? "";
  }, [methods]);

  const [methodId, setMethodId] = useState<string>(defaultMethodId);
  const [received, setReceived] = useState<string>("");
  const [reference, setReference] = useState<string>("");

  const method = methods.find((m) => m.id === methodId);
  const isCash = method?.code === "CASH";

  // Reset cuando el dialog se abre
  useEffect(() => {
    if (open) {
      setMethodId(defaultMethodId);
      setReceived("");
      setReference("");
    }
  }, [open, defaultMethodId]);

  const receivedNum = Number(received) || 0;
  const change = isCash ? +(receivedNum - total).toFixed(2) : 0;
  const cashShort = isCash && receivedNum > 0 && receivedNum < total;
  const referenceMissing = method?.requiresReference && reference.trim() === "";

  const canSubmit =
    !!method &&
    total > 0 &&
    !referenceMissing &&
    !cashShort &&
    !isPending;

  function handleConfirm() {
    if (!canSubmit || !method) return;
    onConfirm({
      paymentMethodId: method.id,
      amount: total,
      reference: reference.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total a cobrar
            </p>
            <p className="mt-1 text-3xl font-bold font-mono text-primary">
              {formatCurrency(total)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => {
                const active = m.id === methodId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "hover:bg-muted",
                    )}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {method?.requiresReference && (
            <div className="space-y-1">
              <Label htmlFor="reference">
                N° de operación{" "}
                <span className="text-xs text-muted-foreground">
                  ({method.name})
                </span>
              </Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej. 12345678"
                autoFocus
                autoComplete="off"
              />
              {referenceMissing && (
                <p className="text-xs text-destructive">
                  Requerido para {method.name}
                </p>
              )}
            </div>
          )}

          {isCash && (
            <>
              <div className="space-y-1">
                <Label htmlFor="received">Monto recibido (S/)</Label>
                <Input
                  id="received"
                  type="number"
                  step="0.01"
                  min="0"
                  value={received}
                  onChange={(e) => setReceived(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="text-xl font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit) {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                />
              </div>

              {receivedNum > 0 && (
                <Alert
                  variant={cashShort ? "destructive" : "default"}
                  className={
                    !cashShort ? "border-emerald-500/30 bg-emerald-50" : ""
                  }
                >
                  <AlertDescription className="flex items-center justify-between text-base font-mono">
                    {cashShort ? (
                      <>
                        <span>Falta</span>
                        <span className="font-bold">
                          {formatCurrency(total - receivedNum)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">VUELTO</span>
                        <span className="text-xl font-bold text-emerald-700">
                          {formatCurrency(change)}
                        </span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="min-w-32"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Confirmar venta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
