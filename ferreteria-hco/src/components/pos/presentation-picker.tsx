"use client";

import { useEffect, useState } from "react";

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
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { SearchResult, Presentation } from "./pos-search";

type Props = {
  product: SearchResult | null;
  onClose: () => void;
  onConfirm: (presentation: Presentation, quantity: number) => void;
};

export function PresentationPicker({ product, onClose, onConfirm }: Props) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      const def = product.presentations.find((p) => p.isDefault);
      setPickedId(def?.id ?? product.presentations[0]?.id ?? null);
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const picked = product.presentations.find((p) => p.id === pickedId);

  function handleConfirm() {
    if (!picked || quantity <= 0) return;
    onConfirm(picked, quantity);
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="uppercase">{product.name}</DialogTitle>
          <DialogDescription>
            Elegí la presentación a agregar al carrito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {product.presentations.map((pres) => {
            const isPicked = pres.id === pickedId;
            return (
              <button
                key={pres.id}
                type="button"
                onClick={() => setPickedId(pres.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors",
                  isPicked
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted",
                )}
              >
                <div>
                  <p className="font-medium uppercase">
                    {pres.unitName}
                    {pres.factor !== 1 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        × {pres.factor} {product.unitSymbol}
                      </span>
                    )}
                    {pres.isDefault && (
                      <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                        Default
                      </span>
                    )}
                  </p>
                  {pres.barcode && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {pres.barcode}
                    </p>
                  )}
                </div>
                <p className="font-mono font-semibold">
                  {formatCurrency(pres.salePrice)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            step="0.001"
            min="0.001"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleConfirm} disabled={!picked || quantity <= 0}>
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
