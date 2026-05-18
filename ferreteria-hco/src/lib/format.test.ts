import { describe, expect, it } from "vitest";

import { formatCurrency, formatQuantity, formatDateTime, formatDate } from "./format";

describe("formatCurrency", () => {
  it("formatea con símbolo default S/ y 2 decimales", () => {
    expect(formatCurrency(41.2)).toBe("S/ 41.20");
    expect(formatCurrency(0)).toBe("S/ 0.00");
    expect(formatCurrency(1000)).toBe("S/ 1,000.00");
    expect(formatCurrency(1234567.89)).toBe("S/ 1,234,567.89");
  });

  it("acepta símbolo custom", () => {
    expect(formatCurrency(50, "$")).toBe("$ 50.00");
  });

  it("maneja negativos (vuelto en exceso, diferencias)", () => {
    expect(formatCurrency(-5)).toBe("S/ -5.00");
  });
});

describe("formatQuantity", () => {
  it("muestra hasta 3 decimales sin ceros sobrantes", () => {
    expect(formatQuantity(1)).toBe("1");
    expect(formatQuantity(1.5)).toBe("1.5");
    expect(formatQuantity(1.5)).toBe("1.5");
    expect(formatQuantity(0.125)).toBe("0.125");
    expect(formatQuantity(100)).toBe("100");
  });

  it("acepta 0 y números muy pequeños", () => {
    expect(formatQuantity(0)).toBe("0");
    expect(formatQuantity(0.001)).toBe("0.001");
  });
});

describe("formatDateTime", () => {
  it("formato determinista dd/MM/yyyy HH:mm en Lima TZ (UTC-5)", () => {
    // 2026-05-18T22:15:00Z = 2026-05-18T17:15 en Lima
    const d = new Date("2026-05-18T22:15:00.000Z");
    expect(formatDateTime(d)).toBe("18/05/2026 17:15");
  });

  it("idéntico para Date y para ISO string", () => {
    const iso = "2026-05-18T22:15:00.000Z";
    expect(formatDateTime(iso)).toBe(formatDateTime(new Date(iso)));
  });

  it("retorna '—' para null/undefined", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("cruce de día UTC vs Lima", () => {
    // 2026-05-19T02:00:00Z = 2026-05-18T21:00 en Lima (UTC-5)
    const d = new Date("2026-05-19T02:00:00.000Z");
    expect(formatDateTime(d)).toBe("18/05/2026 21:00");
  });
});

describe("formatDate", () => {
  it("formato dd/MM/yyyy en Lima TZ", () => {
    const d = new Date("2026-05-18T22:15:00.000Z");
    expect(formatDate(d)).toBe("18/05/2026");
  });

  it("retorna '—' para null", () => {
    expect(formatDate(null)).toBe("—");
  });
});
