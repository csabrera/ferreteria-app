import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getBrands = cache(async () => {
  return prisma.brand.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
});

export type BrandListItem = Awaited<ReturnType<typeof getBrands>>[number];

export const getActiveBrands = cache(async () => {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
});
