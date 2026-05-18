import { requireAdmin } from "@/lib/auth-guards";
import { getActiveStores } from "@/server/queries/store.queries";
import {
  listCashSessionsForAdmin,
  CASH_SESSIONS_PAGE_SIZE,
} from "@/server/queries/cash.queries";
import { TablePagination } from "@/components/shared/table-pagination";
import { parsePageParam } from "@/lib/pagination";

import { CashSessionsPanel } from "./_components/cash-sessions-panel";

type SearchParams = {
  storeId?: string;
  status?: string;
  page?: string;
};

export default async function AdminCajaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const storeId = searchParams.storeId ?? null;
  const rawStatus = searchParams.status ?? null;
  const status =
    rawStatus === "OPEN" || rawStatus === "CLOSED" ? rawStatus : null;
  const page = parsePageParam(searchParams.page);

  const [stores, result] = await Promise.all([
    getActiveStores(),
    listCashSessionsForAdmin(
      { storeId, status },
      { page, pageSize: CASH_SESSIONS_PAGE_SIZE },
    ),
  ]);

  const openCount = result.items.filter((s) => s.status === "OPEN").length;
  const closedCount = result.items.length - openCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
        <p className="text-muted-foreground">
          Estado de las cajas y sesiones por sucursal.
        </p>
      </div>

      <CashSessionsPanel
        sessions={result.items}
        stores={stores}
        selectedStoreId={storeId}
        selectedStatus={status}
        openCount={openCount}
        closedCount={closedCount}
        startIndex={(result.page - 1) * result.pageSize}
      />

      <TablePagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        basePath="/cajas"
        label={{ singular: "sesión", plural: "sesiones" }}
      />
    </div>
  );
}
