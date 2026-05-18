import { requireAdmin } from "@/lib/auth-guards";
import { getUsers } from "@/server/queries/user.queries";
import {
  AUDIT_DEFAULT_PAGE_SIZE,
  listAuditLogs,
  type AuditFilters,
} from "@/server/queries/audit.queries";

import { AuditFilters as AuditFiltersUI } from "./_components/audit-filters";
import { AuditTable } from "./_components/audit-table";
import { AuditPagination } from "./_components/audit-pagination";

type SearchParams = {
  userId?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
  page?: string;
};

function parseDate(
  yyyymmdd: string | undefined,
  endOfDay = false,
): Date | null {
  if (!yyyymmdd) return null;
  // Interpretar como inicio (o fin) del día en Lima (UTC-5 fijo)
  const base = `${yyyymmdd}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}-05:00`;
  const d = new Date(base);
  return isNaN(d.getTime()) ? null : d;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const filters: AuditFilters = {
    userId: searchParams.userId ?? null,
    action: searchParams.action ?? null,
    entity: searchParams.entity ?? null,
    from: parseDate(searchParams.from, false),
    to: parseDate(searchParams.to, true),
  };
  const page = parsePage(searchParams.page);

  const [result, users] = await Promise.all([
    listAuditLogs(filters, { page, pageSize: AUDIT_DEFAULT_PAGE_SIZE }),
    getUsers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground">
          Trazabilidad de acciones críticas del sistema.
        </p>
      </div>

      <AuditFiltersUI
        users={users.map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastNameP: u.lastNameP,
          documentNumber: u.documentNumber,
        }))}
        initialFilters={{
          userId: searchParams.userId ?? null,
          action: searchParams.action ?? null,
          entity: searchParams.entity ?? null,
          from: searchParams.from ?? null,
          to: searchParams.to ?? null,
        }}
      />

      <div className="space-y-2">
        <AuditTable
          logs={result.items}
          startIndex={(result.page - 1) * result.pageSize}
        />
        <AuditPagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          totalPages={result.totalPages}
        />
      </div>
    </div>
  );
}
