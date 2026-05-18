import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getSuppliers = cache(async () => {
  return prisma.supplier.findMany({
    orderBy: [{ isActive: "desc" }, { businessName: "asc" }],
    select: {
      id: true,
      ruc: true,
      businessName: true,
      contactName: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      isActive: true,
      _count: { select: { inventoryMovements: true } },
    },
  });
});

export type SupplierListItem = Awaited<ReturnType<typeof getSuppliers>>[number];

export const getActiveSuppliers = cache(async () => {
  return prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { businessName: "asc" },
    select: { id: true, ruc: true, businessName: true },
  });
});
