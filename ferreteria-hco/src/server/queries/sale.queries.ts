import { prisma } from "@/lib/prisma";

/** Detalle completo de una venta para el ticket o vista de detalle. */
export async function getSaleForTicket(saleId: string) {
  return prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      store: { select: { code: true, name: true, address: true, phone: true } },
      user: {
        select: { firstName: true, lastNameP: true, lastNameM: true },
      },
      cashSession: {
        include: { cashRegister: { select: { name: true } } },
      },
      items: {
        include: {
          product: { select: { name: true, sku: true } },
          productUnit: {
            include: { unit: { select: { symbol: true, name: true } } },
          },
        },
        orderBy: { id: "asc" },
      },
      payments: {
        include: { paymentMethod: { select: { name: true, code: true } } },
      },
    },
  });
}

export type SaleForTicket = NonNullable<
  Awaited<ReturnType<typeof getSaleForTicket>>
>;

/** Ventas del turno actual (vendor) — usado en /ventas. */
export async function getSalesForCashSession(cashSessionId: string) {
  return prisma.sale.findMany({
    where: { cashSessionId },
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        include: { paymentMethod: { select: { name: true, code: true } } },
      },
      _count: { select: { items: true } },
    },
  });
}

export type SaleListItem = Awaited<
  ReturnType<typeof getSalesForCashSession>
>[number];
