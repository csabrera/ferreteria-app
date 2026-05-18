"use client";

import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatQuantity } from "@/lib/format";
import type { InsufficientStockLine } from "@/schemas/sale.schema";

type Props = {
  lines: InsufficientStockLine[] | null;
  onClose: () => void;
};

export function InsufficientStockDialog({ lines, onClose }: Props) {
  return (
    <Dialog open={!!lines} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Stock insuficiente
          </DialogTitle>
          <DialogDescription>
            Estos productos no tienen stock suficiente en tu sucursal. Ajustá las
            cantidades del carrito antes de cobrar.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {lines?.map((l) => (
            <li
              key={l.productUnitId}
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
            >
              <p className="font-medium uppercase">{l.productName}</p>
              <p className="mt-1 flex justify-between font-mono text-xs">
                <span>
                  Solicitado:{" "}
                  <strong className="text-destructive">
                    {formatQuantity(l.requested)} {l.unitSymbol}
                  </strong>
                </span>
                <span>
                  Disponible:{" "}
                  <strong>
                    {formatQuantity(l.available)} {l.unitSymbol}
                  </strong>
                </span>
              </p>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button onClick={onClose}>Ajustar carrito</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
