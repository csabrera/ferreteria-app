import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { MovementType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { getProductById } from "@/server/queries/product.queries";
import { getKardex, KARDEX_PAGE_SIZE } from "@/server/queries/inventory.queries";
import { getActiveStores } from "@/server/queries/store.queries";
import { TablePagination } from "@/components/shared/table-pagination";
import { parsePageParam } from "@/lib/pagination";

import { KardexHeader } from "./_components/kardex-header";
import { KardexFilters } from "./_components/kardex-filters";
import { KardexTable } from "./_components/kardex-table";

type Props = {
  params: { productId: string };
  searchParams: {
    storeId?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: string;
  };
};

const VALID_TYPES: MovementType[] = [
  "ENTRY",
  "EXIT",
  "ADJUSTMENT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "SALE",
  "SALE_VOID",
];

export default async function KardexPage({ params, searchParams }: Props) {
  const product = await getProductById(params.productId);
  if (!product) notFound();

  const filters = {
    productId: params.productId,
    storeId: searchParams.storeId || undefined,
    type:
      searchParams.type && VALID_TYPES.includes(searchParams.type as MovementType)
        ? (searchParams.type as MovementType)
        : undefined,
    from: searchParams.from ? new Date(searchParams.from) : undefined,
    to: searchParams.to ? new Date(searchParams.to + "T23:59:59") : undefined,
  };

  const page = parsePageParam(searchParams.page);
  const [result, stores] = await Promise.all([
    getKardex(filters, { page, pageSize: KARDEX_PAGE_SIZE }),
    getActiveStores(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventario">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver al inventario
          </Link>
        </Button>
      </div>

      <KardexHeader product={product} />

      <KardexFilters
        stores={stores}
        initial={{
          storeId: filters.storeId,
          type: filters.type,
          from: searchParams.from,
          to: searchParams.to,
        }}
        productId={product.id}
      />

      <div className="space-y-2">
        <KardexTable
          movements={result.items}
          unitSymbol={product.baseUnit.symbol}
          productSku={product.sku}
          startIndex={(result.page - 1) * result.pageSize}
        />
        <TablePagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          totalPages={result.totalPages}
          basePath={`/inventario/kardex/${product.id}`}
          label={{ singular: "movimiento", plural: "movimientos" }}
        />
      </div>
    </div>
  );
}
