import { describe, expect, it } from "vitest";

import { computeExpectedAmount, signedDelta } from "./cash";

describe("signedDelta", () => {
  it.each([
    ["INCOME", 100, 100],
    ["DEPOSIT", 50, 50],
    ["SALE", 41.2, 41.2],
    ["EXPENSE", 5, -5],
    ["WITHDRAWAL", 20, -20],
  ] as const)("%s con monto %f → %f", (type, amount, expected) => {
    expect(signedDelta(type, amount)).toBe(expected);
  });

  it("acepta monto 0 sin romper", () => {
    expect(signedDelta("INCOME", 0)).toBe(0);
    expect(signedDelta("EXPENSE", 0)).toBe(-0);
  });
});

describe("computeExpectedAmount", () => {
  it("retorna el monto de apertura si no hay movimientos", () => {
    expect(computeExpectedAmount(50, [])).toBe(50);
  });

  it("suma ingresos y depósitos, resta gastos y retiros", () => {
    // Escenario validado por el usuario en Paso 10:
    // apertura S/.50 + ingreso 10 - gasto 5 - retiro 20 = S/.35
    const result = computeExpectedAmount(50, [
      { type: "INCOME", amount: 10 },
      { type: "EXPENSE", amount: 5 },
      { type: "WITHDRAWAL", amount: 20 },
    ]);
    expect(result).toBe(35);
  });

  it("suma SALE (venta en efectivo) al esperado", () => {
    // Venta de efectivo: S/.50 inicial + S/.41.20 de venta = S/.91.20
    const result = computeExpectedAmount(50, [
      { type: "SALE", amount: 41.2 },
    ]);
    expect(result).toBe(91.2);
  });

  it("redondea a 2 decimales (evita imprecisión de floats)", () => {
    // 0.1 + 0.2 = 0.30000000000000004 en JS — el round explícito lo arregla
    const result = computeExpectedAmount(0, [
      { type: "INCOME", amount: 0.1 },
      { type: "INCOME", amount: 0.2 },
    ]);
    expect(result).toBe(0.3);
  });

  it("escenario complejo con múltiples movimientos mixtos", () => {
    const result = computeExpectedAmount(100, [
      { type: "SALE", amount: 50 },
      { type: "SALE", amount: 30 },
      { type: "INCOME", amount: 20 },
      { type: "EXPENSE", amount: 15 },
      { type: "WITHDRAWAL", amount: 40 },
      { type: "DEPOSIT", amount: 5 },
    ]);
    // 100 + 50 + 30 + 20 - 15 - 40 + 5 = 150
    expect(result).toBe(150);
  });
});
