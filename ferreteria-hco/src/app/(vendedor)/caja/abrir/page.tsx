import { redirect } from "next/navigation";

import { requireVendor } from "@/lib/auth-guards";
import {
  getActiveCashSession,
  getCashRegistersForUser,
} from "@/server/queries/cash.queries";

import { OpenCashForm } from "./_components/open-cash-form";

export default async function AbrirCajaPage() {
  const session = await requireVendor();

  // Si ya tiene caja abierta, no debe abrir otra
  const active = await getActiveCashSession(session.user.id);
  if (active) redirect("/caja/movimientos");

  const registers = await getCashRegistersForUser(session.user.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abrir caja</h1>
        <p className="text-muted-foreground">
          Registra el monto inicial con el que arrancas tu turno. No podrás
          vender hasta que abras tu caja.
        </p>
      </div>

      <OpenCashForm
        registers={registers.map((r) => ({
          id: r.id,
          name: r.name,
          storeCode: r.store.code,
          storeName: r.store.name,
          isOpenByOther: r.sessions.length > 0,
          openedBy:
            r.sessions[0] != null
              ? `${r.sessions[0].user.firstName} ${r.sessions[0].user.lastNameP}`
              : null,
        }))}
      />
    </div>
  );
}
