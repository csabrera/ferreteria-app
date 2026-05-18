import { describe, expect, it } from "vitest";

import { createSaleSchema } from "./sale.schema";

describe("createSaleSchema", () => {
  it("acepta venta válida con un item y pago efectivo", () => {
    const result = createSaleSchema.safeParse({
      items: [{ productUnitId: "pu-1", quantity: 2 }],
      discount: 0,
      payment: { paymentMethodId: "pm-cash", amount: 20, reference: "" },
    });
    expect(result.success).toBe(true);
  });

  it("rechaza venta sin items", () => {
    const result = createSaleSchema.safeParse({
      items: [],
      discount: 0,
      payment: { paymentMethodId: "pm-cash", amount: 0 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/al menos/i);
    }
  });

  it("rechaza cantidades negativas o cero", () => {
    const zero = createSaleSchema.safeParse({
      items: [{ productUnitId: "pu-1", quantity: 0 }],
      discount: 0,
      payment: { paymentMethodId: "pm-cash", amount: 10 },
    });
    expect(zero.success).toBe(false);

    const neg = createSaleSchema.safeParse({
      items: [{ productUnitId: "pu-1", quantity: -1 }],
      discount: 0,
      payment: { paymentMethodId: "pm-cash", amount: 10 },
    });
    expect(neg.success).toBe(false);
  });

  it("rechaza descuento negativo", () => {
    const result = createSaleSchema.safeParse({
      items: [{ productUnitId: "pu-1", quantity: 1 }],
      discount: -5,
      payment: { paymentMethodId: "pm-cash", amount: 10 },
    });
    expect(result.success).toBe(false);
  });

  it("coerce strings numéricos en quantity (form data)", () => {
    const result = createSaleSchema.safeParse({
      items: [{ productUnitId: "pu-1", quantity: "2.5" }],
      discount: "0",
      payment: { paymentMethodId: "pm-cash", amount: "25" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0]?.quantity).toBe(2.5);
    }
  });
});
