import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getUnits = cache(async () => {
  return prisma.unit.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      symbol: true,
      _count: {
        select: { productsAsBase: true, productUnits: true },
      },
    },
  });
});

export type UnitListItem = Awaited<ReturnType<typeof getUnits>>[number];
