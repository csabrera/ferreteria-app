import { describe, expect, it } from "vitest";

import { computeTotals, type CartLine } from "./cart.store";

function makeLine(overrides: Partial<CartLine>): CartLine {
  return {
    lineId: "line-1",
    productId: "prod-1",
    productUnitId: "pu-1",
    name: "producto demo",
    image: null,
    unitSymbol: "un",
    unitCode: "UN",
    presentationLabel: "Unidad",
    unitPrice: 10,
    quantity: 1,
    ...overrides,
  };
}

describe("computeTotals", () => {
  it("retorna ceros con carrito vacío", () => {
    expect(computeTotals([], 0)).toEqual({
      subtotal: 0,
      discount: 0,
      total: 0,
      itemCount: 0,
    });
  });

  it("suma subtotal correctamente con múltiples líneas", () => {
    const lines = [
      makeLine({ unitPrice: 10, quantity: 3 }),
      makeLine({ lineId: "line-2", unitPrice: 5.5, quantity: 2 }),
    ];
    const t = computeTotals(lines, 0);
    expect(t.subtotal).toBe(41);
    expect(t.total).toBe(41);
    expect(t.itemCount).toBe(5);
  });

  it("aplica descuento al total", () => {
    const lines = [makeLine({ unitPrice: 100, quantity: 1 })];
    const t = computeTotals(lines, 20);
    expect(t.subtotal).toBe(100);
    expect(t.discount).toBe(20);
    expect(t.total).toBe(80);
  });

  it("clamp del descuento: nunca negativo", () => {
    const lines = [makeLine({ unitPrice: 100, quantity: 1 })];
    const t = computeTotals(lines, -50);
    expect(t.discount).toBe(0);
    expect(t.total).toBe(100);
  });

  it("clamp del descuento: nunca mayor al subtotal", () => {
    const lines = [makeLine({ unitPrice: 100, quantity: 1 })];
    const t = computeTotals(lines, 999);
    expect(t.discount).toBe(100);
    expect(t.total).toBe(0);
  });

  it("redondea a 2 decimales", () => {
    const lines = [
      makeLine({ unitPrice: 0.1, quantity: 1 }),
      makeLine({ lineId: "line-2", unitPrice: 0.2, quantity: 1 }),
    ];
    const t = computeTotals(lines, 0);
    expect(t.subtotal).toBe(0.3);
    expect(t.total).toBe(0.3);
  });
});
