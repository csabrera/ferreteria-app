import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

/**
 * Búsqueda autocompletada de productos para el POS y otros formularios.
 *
 * Busca por:
 *   - SKU del producto (UPPERCASE en BD)
 *   - barcode del producto (UPPERCASE en BD)
 *   - nombre del producto (lowercase en BD)
 *   - barcode de cualquier ProductUnit (presentación)
 *
 * Si se pasa `?storeId=...`, devuelve `storeStock` (stock SOLO de esa sucursal,
 * para que el POS muestre lo que realmente puede vender). `totalStock` sigue
 * siendo la suma de todas las sucursales (para inventory entry y otros usos
 * administrativos).
 */
export async function GET(req: NextRequest) {
  await requireSession();

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const storeIdParam = req.nextUrl.searchParams.get("storeId");
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const lower = q.toLowerCase();
  const upper = q.toUpperCase();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { sku: { contains: upper } },
        { barcode: { contains: upper } },
        { name: { contains: lower } },
        { productUnits: { some: { barcode: { contains: upper } } } },
      ],
    },
    take: 15,
    orderBy: { name: "asc" },
    select: {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      images: true,
      salePrice: true,
      baseUnit: { select: { code: true, symbol: true } },
      brand: { select: { name: true } },
      stocks: { select: { quantity: true, storeId: true } },
      productUnits: {
        select: {
          id: true,
          factor: true,
          salePrice: true,
          barcode: true,
          isDefault: true,
          unit: { select: { code: true, symbol: true, name: true } },
        },
        orderBy: [{ isDefault: "desc" }, { factor: "asc" }],
      },
    },
  });

  const results = products.map((p) => {
    const presentations = p.productUnits.map((pu) => ({
      id: pu.id,
      unitCode: pu.unit.code,
      unitSymbol: pu.unit.symbol,
      unitName: pu.unit.name,
      factor: Number(pu.factor),
      salePrice: Number(pu.salePrice),
      barcode: pu.barcode,
      isDefault: pu.isDefault,
    }));

    const matched = presentations.find(
      (pres) => pres.barcode && pres.barcode.toUpperCase() === upper,
    );

    const totalStock = p.stocks.reduce(
      (sum, s) => sum + Number(s.quantity),
      0,
    );

    const storeStock = storeIdParam
      ? p.stocks
          .filter((s) => s.storeId === storeIdParam)
          .reduce((sum, s) => sum + Number(s.quantity), 0)
      : null;

    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      image: p.images[0] ?? null,
      salePrice: Number(p.salePrice),
      unitCode: p.baseUnit.code,
      unitSymbol: p.baseUnit.symbol,
      brand: p.brand?.name ?? null,
      totalStock,
      storeStock,
      presentations,
      matchedPresentationId: matched?.id ?? null,
    };
  });

  return NextResponse.json({ results });
}
