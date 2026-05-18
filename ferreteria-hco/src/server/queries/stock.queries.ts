import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const STOCK_PAGE_SIZE = 10;

type StockFilters = {
  storeId?: string;
  categoryId?: string;
  brandId?: string;
  search?: string;
  onlyCritical?: boolean;
};

function stockWhere(filters: StockFilters) {
  return {
    ...(filters.storeId && { storeId: filters.storeId }),
    ...(filters.onlyCritical && {
      minStock: { gt: 0 },
      quantity: { lte: prisma.stock.fields.minStock },
    }),
    product: {
      isActive: true,
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.brandId && { brandId: filters.brandId }),
      ...(filters.search && {
        OR: [
          { sku: { contains: filters.search.toUpperCase() } },
          { barcode: { contains: filters.search.toUpperCase() } },
          { name: { contains: filters.search.toLowerCase() } },
        ],
      }),
    },
  };
}

export const getStockList = cache(async (
  filters: StockFilters = {},
  opts: { page?: number; pageSize?: number } = {},
) => {
  const where = stockWhere(filters);
  const pageSize = Math.max(1, Math.min(opts.pageSize ?? STOCK_PAGE_SIZE, 200));
  const requestedPage = Math.max(1, opts.page ?? 1);

  const total = await prisma.stock.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const stocks = await prisma.stock.findMany({
    where,
    orderBy: [{ product: { name: "asc" } }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      productId: true,
      storeId: true,
      quantity: true,
      minStock: true,
      maxStock: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          sku: true,
          barcode: true,
          name: true,
          images: true,
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          baseUnit: { select: { code: true, symbol: true } },
        },
      },
      store: { select: { id: true, code: true, name: true } },
    },
  });

  const items = stocks.map((s) => ({
    ...s,
    quantity: Number(s.quantity),
    minStock: Number(s.minStock),
    maxStock: s.maxStock !== null ? Number(s.maxStock) : null,
  }));

  return { items, total, page, pageSize, totalPages };
});

export type StockListItem = Awaited<ReturnType<typeof getStockList>>["items"][number];
