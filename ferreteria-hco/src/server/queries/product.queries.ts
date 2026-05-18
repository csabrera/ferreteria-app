import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const PRODUCTS_PAGE_SIZE = 10;

type ProductFilters = {
  search?: string;
  categoryId?: string;
  brandId?: string;
  onlyActive?: boolean;
};

function productsWhere(filters: ProductFilters) {
  return {
    ...(filters.onlyActive && { isActive: true }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.brandId && { brandId: filters.brandId }),
    ...(filters.search && {
      OR: [
        { sku: { contains: filters.search.toUpperCase() } },
        { barcode: { contains: filters.search.toUpperCase() } },
        { name: { contains: filters.search.toLowerCase() } },
      ],
    }),
  };
}

export const getProducts = cache(async (
  filters: ProductFilters = {},
  opts: { page?: number; pageSize?: number } = {},
) => {
  const where = productsWhere(filters);
  const pageSize = Math.max(1, Math.min(opts.pageSize ?? PRODUCTS_PAGE_SIZE, 200));
  const requestedPage = Math.max(1, opts.page ?? 1);

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      sku: true,
      barcode: true,
      name: true,
      images: true,
      costPrice: true,
      salePrice: true,
      isActive: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      baseUnit: { select: { id: true, code: true, symbol: true } },
      stocks: { select: { quantity: true, minStock: true, storeId: true } },
    },
  });

  const items = products.map((p) => ({
    ...p,
    costPrice: Number(p.costPrice),
    salePrice: Number(p.salePrice),
    totalStock: p.stocks.reduce((sum, s) => sum + Number(s.quantity), 0),
    hasCriticalStock: p.stocks.some(
      (s) => Number(s.quantity) <= Number(s.minStock) && Number(s.minStock) > 0,
    ),
  }));

  return { items, total, page, pageSize, totalPages };
});

export type ProductListItem = Awaited<ReturnType<typeof getProducts>>["items"][number];

export const getProductById = cache(async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      baseUnit: true,
      productUnits: {
        include: { unit: true },
        orderBy: [{ isDefault: "desc" }, { factor: "asc" }],
      },
      stocks: {
        include: { store: { select: { id: true, code: true, name: true } } },
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    costPrice: Number(product.costPrice),
    salePrice: Number(product.salePrice),
    productUnits: product.productUnits.map((pu) => ({
      ...pu,
      factor: Number(pu.factor),
      salePrice: Number(pu.salePrice),
    })),
    stocks: product.stocks.map((s) => ({
      ...s,
      quantity: Number(s.quantity),
      minStock: Number(s.minStock),
      maxStock: s.maxStock ? Number(s.maxStock) : null,
    })),
  };
});

/**
 * Genera un SKU único con formato `PRD-XXXXXX` (6 dígitos numéricos).
 */
export async function generateUniqueSku(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const num = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const candidate = `PRD-${num}`;
    const exists = await prisma.product.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("No se pudo generar SKU único");
}
