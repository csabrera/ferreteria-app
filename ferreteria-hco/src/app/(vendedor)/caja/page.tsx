import { redirect } from "next/navigation";

import { requireVendor } from "@/lib/auth-guards";
import { getActiveCashSession } from "@/server/queries/cash.queries";

export default async function CajaIndexPage() {
  const session = await requireVendor();
  const active = await getActiveCashSession(session.user.id);
  if (active) redirect("/caja/movimientos");
  redirect("/caja/abrir");
}
