import { redirect } from "next/navigation";

import { requireVendor } from "@/lib/auth-guards";
import { getActiveCashSessionWithMovements } from "@/server/queries/cash.queries";
import { CloseCashForm } from "./_components/close-cash-form";

export default async function CerrarCajaPage() {
  const session = await requireVendor();
  const active = await getActiveCashSessionWithMovements(session.user.id);
  if (!active) redirect("/caja/abrir");

  // Convertir Decimal a number plano para client component
  const POSITIVE = new Set(["INCOME", "DEPOSIT", "SALE"]);
  const opening = Number(active.openingAmount);
  const totalIn = active.movements
    .filter((m) => POSITIVE.has(m.type))
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const totalOut = active.movements
    .filter((m) => !POSITIVE.has(m.type))
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const expected = Number(active.expectedAmount);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cerrar caja</h1>
        <p className="text-muted-foreground">
          Cuenta el efectivo físico antes de cerrar. La diferencia con el saldo
          esperado quedará registrada en auditoría.
        </p>
      </div>

      <CloseCashForm
        opening={opening}
        totalIn={totalIn}
        totalOut={totalOut}
        expected={expected}
        movementsCount={active.movements.length}
        cashRegisterLabel={`${active.cashRegister.name} — ${active.cashRegister.store.code}`}
      />
    </div>
  );
}
