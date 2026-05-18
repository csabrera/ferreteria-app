import { redirect } from "next/navigation";

import { requireVendor } from "@/lib/auth-guards";
import { getActiveCashSession } from "@/server/queries/cash.queries";
import { getActivePaymentMethods } from "@/server/queries/payment-method.queries";
import { PosScreen } from "./_components/pos-screen";

export default async function PosPage() {
  const session = await requireVendor();

  const active = await getActiveCashSession(session.user.id);
  if (!active) redirect("/caja/abrir");

  const paymentMethods = await getActivePaymentMethods();

  return (
    <PosScreen
      sessionInfo={{
        cashRegisterName: active.cashRegister.name,
        storeId: active.cashRegister.storeId,
        storeCode: active.cashRegister.store.code,
        storeName: active.cashRegister.store.name,
        vendorName: session.user.fullName,
        openingAmount: Number(active.openingAmount),
        expectedAmount: Number(active.expectedAmount),
      }}
      paymentMethods={paymentMethods}
    />
  );
}
