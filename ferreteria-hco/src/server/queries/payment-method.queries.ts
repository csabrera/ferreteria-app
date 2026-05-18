import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getActivePaymentMethods = cache(async () => {
  return prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      requiresReference: true,
      affectsCash: true,
    },
  });
});

export type PaymentMethodOption = Awaited<
  ReturnType<typeof getActivePaymentMethods>
>[number];
