import { redirect } from "next/navigation";

import { requireVendor } from "@/lib/auth-guards";
import { getActiveCashSessionWithMovements } from "@/server/queries/cash.queries";
import { CashSessionPanel } from "./_components/cash-session-panel";

export default async function MovimientosCajaPage() {
  const session = await requireVendor();
  const active = await getActiveCashSessionWithMovements(session.user.id);
  if (!active) redirect("/caja/abrir");

  return <CashSessionPanel session={active} />;
}
