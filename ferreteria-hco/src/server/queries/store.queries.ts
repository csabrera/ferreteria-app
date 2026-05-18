import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getStores = cache(async (opts: { onlyActive?: boolean } = {}) => {
  return prisma.store.findMany({
    where: opts.onlyActive ? { isActive: true } : undefined,
    orderBy: { code: "asc" },
    include: {
      _count: {
        select: { users: true, cashRegisters: true, sales: true },
      },
    },
  });
});

export type StoreWithCounts = Awaited<ReturnType<typeof getStores>>[number];

export const getStoreById = cache(async (id: string) => {
  return prisma.store.findUnique({ where: { id } });
});

export const getActiveStores = cache(async () => {
  return prisma.store.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
});
