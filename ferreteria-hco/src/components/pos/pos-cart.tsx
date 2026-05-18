"use client";

import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart, computeTotals } from "@/stores/cart.store";

type Props = {
  onCobrar: () => void;
};

export function PosCart({ onCobrar }: Props) {
  const lines = useCart((s) => s.lines);
  const discount = useCart((s) => s.discount);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const setDiscount = useCart((s) => s.setDiscount);
  const clear = useCart((s) => s.clear);

  const totals = computeTotals(lines, discount);

  const empty = lines.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShoppingCart className="h-4 w-4" />
          Carrito
          {totals.itemCount > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({formatQuantity(totals.itemCount)} ítems)
            </span>
          )}
        </h2>
        {!empty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            title="Limpiar carrito (Esc)"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
            <ShoppingCart className="h-8 w-8 opacity-30" />
            <p>Escaneá o buscá un producto para agregarlo.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {lines.map((l) => {
              const lineTotal = l.unitPrice * l.quantity;
              return (
                <li key={l.lineId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium uppercase">
                        {l.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.presentationLabel} · {formatCurrency(l.unitPrice)} c/u
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(l.lineId)}
                      className="h-7 w-7 p-0"
                      title="Quitar"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(l.lineId, l.quantity - 1)
                        }
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={l.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            l.lineId,
                            Number(e.target.value) || 0,
                          )
                        }
                        className="h-7 w-20 text-center font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(l.lineId, l.quantity + 1)
                        }
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {l.unitSymbol}
                      </span>
                    </div>
                    <p className="font-mono font-semibold">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!empty && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
            <div className="flex items-center justify-between">
              <label
                htmlFor="discount"
                className="text-muted-foreground"
              >
                Descuento
              </label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                max={totals.subtotal}
                value={discount || ""}
                placeholder="0.00"
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="h-7 w-24 text-right font-mono text-sm"
              />
            </div>
            <Row
              label="TOTAL"
              value={formatCurrency(totals.total)}
              bold
            />
          </div>
          <Button
            className="mt-3 h-12 w-full text-base font-semibold"
            onClick={onCobrar}
          >
            Cobrar (F4)
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        bold && "border-t pt-1.5 text-lg",
      )}
    >
      <span className={cn(bold ? "font-bold" : "text-muted-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "font-mono",
          bold ? "font-bold text-primary" : "",
        )}
      >
        {value}
      </span>
    </div>
  );
}
