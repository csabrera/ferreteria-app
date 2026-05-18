"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Carrito del POS. Persistido en localStorage para sobrevivir refreshes
 * accidentales del browser durante un turno. Limpiar manualmente con `clear()`
 * o automáticamente tras una venta exitosa.
 */

export type CartLine = {
  productId: string;
  productUnitId: string;
  // Datos display (cacheados al agregar — no se recargan)
  name: string;
  image: string | null;
  unitSymbol: string;
  unitCode: string;
  presentationLabel: string; // "SC suelto" o "CJ x24" según factor
  // Datos económicos
  unitPrice: number; // precio por la presentación elegida
  quantity: number;
  // ID interno único para la línea (permite agregar mismo producto en distintas presentaciones)
  lineId: string;
};

type CartState = {
  lines: CartLine[];
  discount: number; // descuento GLOBAL al subtotal

  // Mutaciones
  addLine: (input: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  setDiscount: (discount: number) => void;
  clear: () => void;
};

function makeLineId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      discount: 0,

      addLine: (input) =>
        set((state) => {
          // Si ya hay una línea con el mismo productUnitId, suma cantidad
          const existing = state.lines.find(
            (l) => l.productUnitId === input.productUnitId,
          );
          const qty = input.quantity ?? 1;
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.lineId === existing.lineId
                  ? { ...l, quantity: l.quantity + qty }
                  : l,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                productId: input.productId,
                productUnitId: input.productUnitId,
                name: input.name,
                image: input.image,
                unitSymbol: input.unitSymbol,
                unitCode: input.unitCode,
                presentationLabel: input.presentationLabel,
                unitPrice: input.unitPrice,
                quantity: qty,
                lineId: makeLineId(),
              },
            ],
          };
        }),

      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.lineId !== lineId)
              : state.lines.map((l) =>
                  l.lineId === lineId ? { ...l, quantity } : l,
                ),
        })),

      removeLine: (lineId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.lineId !== lineId),
        })),

      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),

      clear: () => set({ lines: [], discount: 0 }),
    }),
    {
      name: "ferreteria-hco-cart",
    },
  ),
);

/** Calcula subtotal/descuento/total. No depende del state global. */
export function computeTotals(lines: CartLine[], discount: number) {
  const subtotal = lines.reduce(
    (acc, l) => acc + l.unitPrice * l.quantity,
    0,
  );
  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const total = subtotal - safeDiscount;
  return {
    subtotal: +subtotal.toFixed(2),
    discount: +safeDiscount.toFixed(2),
    total: +total.toFixed(2),
    itemCount: lines.reduce((acc, l) => acc + l.quantity, 0),
  };
}
