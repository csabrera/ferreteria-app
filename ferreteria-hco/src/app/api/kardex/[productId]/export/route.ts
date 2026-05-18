import { NextResponse, type NextRequest } from "next/server";
import { format } from "date-fns";
import type { MovementType } from "@prisma/client";

import { requireAdmin } from "@/lib/auth-guards";
import { getKardex } from "@/server/queries/inventory.queries";
import { getProductById } from "@/server/queries/product.queries";

const VALID_TYPES: MovementType[] = [
  "ENTRY",
  "EXIT",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "SALE",
  "SALE_VOID",
];

const TYPE_LABEL: Record<MovementType, string> = {
  ENTRY: "Entrada",
  EXIT: "Salida",
  ADJUSTMENT: "Ajuste",
  TRANSFER_IN: "Transferencia entrada",
  TRANSFER_OUT: "Transferencia salida",
  SALE: "Venta",
  SALE_VOID: "Venta anulada",
};

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } },
) {
  await requireAdmin();

  const product = await getProductById(params.productId);
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const filters = {
    productId: params.productId,
    storeId: sp.get("storeId") || undefined,
    type:
      sp.get("type") && VALID_TYPES.includes(sp.get("type") as MovementType)
        ? (sp.get("type") as MovementType)
        : undefined,
    from: sp.get("from") ? new Date(sp.get("from")!) : undefined,
    to: sp.get("to") ? new Date(sp.get("to")! + "T23:59:59") : undefined,
  };

  // Export NO paginado: traemos hasta 10k movimientos del filtro para CSV
  const result = await getKardex(filters, { page: 1, pageSize: 10_000 });
  const movements = result.items;

  const header = [
    "Fecha",
    "Hora",
    "Tipo",
    "Sucursal código",
    "Sucursal nombre",
    "Cantidad",
    "Unidad",
    "Stock anterior",
    "Stock nuevo",
    "Costo unitario",
    "Referencia",
    "Razón",
    "Nota",
    "Usuario",
  ];

  const rows = movements.map((m) => [
    format(new Date(m.createdAt), "dd/MM/yyyy"),
    format(new Date(m.createdAt), "HH:mm:ss"),
    TYPE_LABEL[m.type],
    m.store.code,
    m.store.name.toUpperCase(),
    m.quantity,
    product.baseUnit.symbol,
    m.previousStock,
    m.newStock,
    m.unitCost ?? "",
    m.reference ?? "",
    m.reason ?? "",
    m.reasonNote ?? "",
    `${m.user.firstName} ${m.user.lastNameP}`.toUpperCase(),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  // BOM para Excel — reconoce UTF-8 correctamente
  const body = "﻿" + csv;

  const filename = `kardex-${product.sku}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
