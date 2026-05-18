import { getProducts, PRODUCTS_PAGE_SIZE } from "@/server/queries/product.queries";
import { getCategories } from "@/server/queries/category.queries";
import { getBrands } from "@/server/queries/brand.queries";
import { getUnits } from "@/server/queries/unit.queries";
import { TablePagination } from "@/components/shared/table-pagination";
import { parsePageParam } from "@/lib/pagination";
import { ProductsHeader } from "./_components/products-header";
import { ProductFilters } from "./_components/product-filters";
import { ProductsTable } from "./_components/products-table";

type Props = {
  searchParams: {
    q?: string;
    categoryId?: string;
    brandId?: string;
    page?: string;
  };
};

export default async function ProductosPage({ searchParams }: Props) {
  const filters = {
    search: searchParams.q,
    categoryId: searchParams.categoryId,
    brandId: searchParams.brandId,
  };
  const page = parsePageParam(searchParams.page);

  const [result, categories, brands, units] = await Promise.all([
    getProducts(filters, { page, pageSize: PRODUCTS_PAGE_SIZE }),
    getCategories(),
    getBrands(),
    getUnits(),
  ]);

  const activeBrands = brands
    .filter((b) => b.isActive)
    .map((b) => ({ id: b.id, name: b.name }));
  const activeUnits = units.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    symbol: u.symbol,
  }));

  return (
    <div className="space-y-5">
      <ProductsHeader
        categories={categories}
        brands={activeBrands}
        units={activeUnits}
      />

      <ProductFilters
        categories={categories}
        brands={activeBrands}
        initial={filters}
      />

      <div className="space-y-2">
        <ProductsTable
          products={result.items}
          categories={categories}
          brands={activeBrands}
          units={activeUnits}
          startIndex={(result.page - 1) * result.pageSize}
        />
        <TablePagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          totalPages={result.totalPages}
          basePath="/productos"
          label={{ singular: "producto", plural: "productos" }}
        />
      </div>
    </div>
  );
}
