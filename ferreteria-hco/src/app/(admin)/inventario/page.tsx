import { getStockList, STOCK_PAGE_SIZE } from "@/server/queries/stock.queries";
import { getActiveStores } from "@/server/queries/store.queries";
import { getCategories } from "@/server/queries/category.queries";
import { getBrands } from "@/server/queries/brand.queries";
import { getActiveSuppliers } from "@/server/queries/supplier.queries";
import { TablePagination } from "@/components/shared/table-pagination";
import { parsePageParam } from "@/lib/pagination";
import { InventoryHeader } from "./_components/inventory-header";
import { StockFilters } from "./_components/stock-filters";
import { StockTable } from "./_components/stock-table";

type Props = {
  searchParams: {
    q?: string;
    storeId?: string;
    categoryId?: string;
    brandId?: string;
    critical?: string;
    page?: string;
  };
};

export default async function InventarioPage({ searchParams }: Props) {
  const filters = {
    search: searchParams.q,
    storeId: searchParams.storeId,
    categoryId: searchParams.categoryId,
    brandId: searchParams.brandId,
    onlyCritical: searchParams.critical === "1",
  };
  const page = parsePageParam(searchParams.page);

  const [result, stores, categories, brands, suppliers] = await Promise.all([
    getStockList(filters, { page, pageSize: STOCK_PAGE_SIZE }),
    getActiveStores(),
    getCategories(),
    getBrands(),
    getActiveSuppliers(),
  ]);

  const activeBrands = brands
    .filter((b) => b.isActive)
    .map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="space-y-5">
      <InventoryHeader stores={stores} suppliers={suppliers} />

      <StockFilters
        stores={stores}
        categories={categories}
        brands={activeBrands}
        initial={{
          search: filters.search,
          storeId: filters.storeId,
          categoryId: filters.categoryId,
          brandId: filters.brandId,
          critical: filters.onlyCritical,
        }}
      />

      <div className="space-y-2">
        <StockTable
          stocks={result.items}
          startIndex={(result.page - 1) * result.pageSize}
        />
        <TablePagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          totalPages={result.totalPages}
          basePath="/inventario"
          label={{ singular: "ítem", plural: "ítems" }}
        />
      </div>
    </div>
  );
}
