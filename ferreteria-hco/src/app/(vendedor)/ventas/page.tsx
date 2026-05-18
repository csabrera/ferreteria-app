import { requireVendor } from "@/lib/auth-guards";
import { getLatestCashSessionForUser } from "@/server/queries/cash.queries";
import { getSalesForCashSession } from "@/server/queries/sale.queries";
import { MySalesPanel } from "./_components/my-sales-panel";

export default async function MisVentasPage() {
  const session = await requireVendor();
  const latest = await getLatestCashSessionForUser(session.user.id);

  if (!latest) {
    // El vendor nunca abrió una caja → no hay nada que mostrar
    return (
      <MySalesPanel
        sales={[]}
        cashRegisterLabel="Sin turnos registrados"
        isCurrent={false}
        sessionClosedAt={null}
      />
    );
  }

  const sales = await getSalesForCashSession(latest.id);

  return (
    <MySalesPanel
      sales={sales}
      cashRegisterLabel={`${latest.cashRegister.name} — ${latest.cashRegister.store.code}`}
      isCurrent={latest.status === "OPEN"}
      sessionClosedAt={latest.closedAt}
    />
  );
}
