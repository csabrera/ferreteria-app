import type { CashMovementType } from "@prisma/client";

/**
 * Aplica el signo correcto al monto según el tipo de movimiento.
 * INCOME/DEPOSIT/SALE suman al esperado; EXPENSE/WITHDRAWAL restan.
 */
export function signedDelta(type: CashMovementType, amount: number): number {
  if (type === "INCOME" || type === "DEPOSIT" || type === "SALE") {
    return amount;
  }
  return -amount;
}

/**
 * Calcula el saldo esperado de una sesión de caja a partir del monto de apertura
 * y los movimientos. Helper puro reutilizable en server actions y tests.
 */
export function computeExpectedAmount(
  openingAmount: number,
  movements: { type: CashMovementType; amount: number }[],
): number {
  const delta = movements.reduce(
    (acc, m) => acc + signedDelta(m.type, m.amount),
    0,
  );
  return +(openingAmount + delta).toFixed(2);
}
