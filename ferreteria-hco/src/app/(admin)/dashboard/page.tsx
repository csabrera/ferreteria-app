import { requireAdmin } from "@/lib/auth-guards";
import { getActiveStores } from "@/server/queries/store.queries";
import { getSettings } from "@/server/queries/settings.queries";
import {
  getDashboardKpis,
  getSalesLastDays,
  getTopProducts,
  getStockAlerts,
  getCashStatusByStore,
} from "@/server/queries/dashboard.queries";
import { formatCurrency } from "@/lib/format";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { StockAlerts } from "@/components/dashboard/stock-alerts";
import { CashStatus } from "@/components/dashboard/cash-status";
import { StoreFilter } from "./_components/store-filter";

const PERIOD_DAYS = 7;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { storeId?: string };
}) {
  const session = await requireAdmin();
  const storeId = searchParams.storeId ?? null;

  const [stores, settings, kpis, salesByDay, topProducts, stockAlerts, cashStatus] =
    await Promise.all([
      getActiveStores(),
      getSettings(),
      getDashboardKpis({ storeId }),
      getSalesLastDays({ storeId }, PERIOD_DAYS),
      getTopProducts({ storeId }, PERIOD_DAYS, 5),
      getStockAlerts({ storeId }, 10),
      getCashStatusByStore({ storeId }),
    ]);

  const currencySymbol = settings.currencySymbol;
  const fmt = (n: number) => formatCurrency(n, currencySymbol);

  const selectedStore = storeId
    ? stores.find((s) => s.id === storeId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, <span className="uppercase">{session.user.fullName}</span>
            {selectedStore && (
              <>
                {" "}· Filtrando sucursal{" "}
                <span className="font-mono font-medium">{selectedStore.code}</span>
              </>
            )}
          </p>
        </div>
        <StoreFilter stores={stores} selectedStoreId={storeId} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Ventas hoy"
          value={fmt(kpis.totalToday)}
          current={kpis.totalToday}
          previous={kpis.totalYesterday}
          deltaMode="percent"
          hint="vs ayer"
          highlight
        />
        <KpiCard
          label="Tickets hoy"
          value={String(kpis.ticketsToday)}
          current={kpis.ticketsToday}
          previous={kpis.ticketsYesterday}
          deltaMode="absolute"
          hint="vs ayer"
        />
        <KpiCard
          label="Ticket promedio"
          value={fmt(kpis.avgTicketToday)}
          current={kpis.avgTicketToday}
          previous={kpis.avgTicketYesterday}
          deltaMode="percent"
          hint="vs ayer"
        />
        <KpiCard
          label="Stock crítico"
          value={String(kpis.criticalStockCount)}
          deltaMode="none"
          hint={`${kpis.activeCashSessions} caja${kpis.activeCashSessions === 1 ? "" : "s"} abierta${kpis.activeCashSessions === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <SalesChart data={salesByDay} days={PERIOD_DAYS} />
        <TopProducts products={topProducts} days={PERIOD_DAYS} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <StockAlerts alerts={stockAlerts} />
        <CashStatus stores={cashStatus} />
      </div>
    </div>
  );
}
