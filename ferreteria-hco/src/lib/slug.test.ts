import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  it("normaliza acentos y espacios", () => {
    expect(slugify("Construcción")).toBe("construccion");
    expect(slugify("Cemento Sol Tipo I x 42.5 Kg")).toBe("cemento-sol-tipo-i-x-425-kg");
  });

  it("colapsa múltiples espacios y guiones", () => {
    expect(slugify("hola   mundo")).toBe("hola-mundo");
    expect(slugify("hola---mundo")).toBe("hola-mundo");
  });

  it("trim leading/trailing", () => {
    expect(slugify("  hola  ")).toBe("hola");
  });

  it("acepta strings vacíos sin romper", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it("ñ se convierte a n", () => {
    expect(slugify("España")).toBe("espana");
  });
});
