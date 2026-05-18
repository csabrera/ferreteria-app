import { cache } from "react";
import type { MovementType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const KARDEX_PAGE_SIZE = 10;

type KardexFilters = {
  productId: string;
  storeId?: string;
  type?: MovementType;
  from?: Date;
  to?: Date;
};

function kardexWhere(filters: KardexFilters) {
  return {
    productId: filters.productId,
    ...(filters.storeId && { storeId: filters.storeId }),
    ...(filters.type && { type: filters.type }),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from && { gte: filters.from }),
            ...(filters.to && { lte: filters.to }),
          },
        }
      : {}),
  };
}

export const getKardex = cache(async (
  filters: KardexFilters,
  opts: { page?: number; pageSize?: number } = {},
) => {
  const where = kardexWhere(filters);
  // cap alto: la export CSV usa pageSize=10000 sin paginar
  const pageSize = Math.max(1, Math.min(opts.pageSize ?? KARDEX_PAGE_SIZE, 10_000));
  const requestedPage = Math.max(1, opts.page ?? 1);

  const total = await prisma.inventoryMovement.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const movements = await prisma.inventoryMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      type: true,
      quantity: true,
      unitCost: true,
      previousStock: true,
      newStock: true,
      reference: true,
      reason: true,
      reasonNote: true,
      createdAt: true,
      store: { select: { id: true, code: true, name: true } },
      user: { select: { firstName: true, lastNameP: true } },
    },
  });

  const items = movements.map((m) => ({
    ...m,
    quantity: Number(m.quantity),
    unitCost: m.unitCost !== null ? Number(m.unitCost) : null,
    previousStock: Number(m.previousStock),
    newStock: Number(m.newStock),
  }));

  return { items, total, page, pageSize, totalPages };
});

export type KardexMovement = Awaited<ReturnType<typeof getKardex>>["items"][number];
