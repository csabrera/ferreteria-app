"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import { signedDelta } from "@/lib/cash";
import {
  openCashSessionSchema,
  addCashMovementSchema,
  closeCashSessionSchema,
  type OpenCashSessionInput,
  type AddCashMovementInput,
  type CloseCashSessionInput,
} from "@/schemas/cash.schema";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function openCashSession(
  input: OpenCashSessionInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();

  const parsed = openCashSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const notes = data.notes && data.notes.trim() !== "" ? data.notes : null;

  const register = await prisma.cashRegister.findUnique({
    where: { id: data.cashRegisterId },
    include: { store: true },
  });
  if (!register) return { ok: false, error: "Caja no encontrada" };
  if (!register.isActive) return { ok: false, error: "La caja está inactiva" };
  if (!register.store.isActive)
    return { ok: false, error: "La sucursal está inactiva" };

  // Vendor solo opera cajas de su propia sucursal
  if (
    session.user.role === "VENDOR" &&
    session.user.storeId &&
    session.user.storeId !== register.storeId
  ) {
    return { ok: false, error: "La caja no pertenece a tu sucursal" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const myOpen = await tx.cashSession.findFirst({
        where: { userId: session.user.id, status: "OPEN" },
        select: { id: true },
      });
      if (myOpen) {
        throw new Error("Ya tienes una caja abierta. Ciérrala antes de abrir otra");
      }

      const registerOpen = await tx.cashSession.findFirst({
        where: { cashRegisterId: data.cashRegisterId, status: "OPEN" },
        include: { user: { select: { firstName: true, lastNameP: true } } },
      });
      if (registerOpen) {
        const who = `${registerOpen.user.firstName} ${registerOpen.user.lastNameP}`.toUpperCase();
        throw new Error(`Esta caja ya está abierta por ${who}`);
      }

      return tx.cashSession.create({
        data: {
          cashRegisterId: data.cashRegisterId,
          userId: session.user.id,
          openingAmount: data.openingAmount,
          expectedAmount: data.openingAmount,
          notes,
          status: "OPEN",
        },
      });
    });

    await logAction({
      userId: session.user.id,
      action: "CASH_SESSION_OPEN",
      entity: "CashSession",
      entityId: result.id,
      after: {
        cashRegisterId: data.cashRegisterId,
        cashRegisterName: register.name,
        storeCode: register.store.code,
        openingAmount: data.openingAmount,
        notes,
      },
    });

    revalidatePath("/caja", "layout");
    revalidatePath("/cajas");
    revalidatePath("/pos");
    return { ok: true, data: { id: result.id } };
  } catch (err) {
    console.error("[openCashSession]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo abrir la caja",
    };
  }
}

export async function addCashMovement(
  input: AddCashMovementInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();

  const parsed = addCashMovementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const active = await tx.cashSession.findFirst({
        where: { userId: session.user.id, status: "OPEN" },
        select: { id: true, expectedAmount: true },
      });
      if (!active) {
        throw new Error("No tienes una caja abierta");
      }

      const delta = signedDelta(data.type, data.amount);
      const newExpected = Number(active.expectedAmount) + delta;

      if (newExpected < 0) {
        throw new Error(
          "El movimiento dejaría el saldo en negativo. Verifica el monto",
        );
      }

      const movement = await tx.cashMovement.create({
        data: {
          cashSessionId: active.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          userId: session.user.id,
        },
      });

      await tx.cashSession.update({
        where: { id: active.id },
        data: { expectedAmount: newExpected },
      });

      return { movementId: movement.id, sessionId: active.id };
    });

    await logAction({
      userId: session.user.id,
      action: `CASH_MOVEMENT_${data.type}`,
      entity: "CashMovement",
      entityId: result.movementId,
      after: {
        cashSessionId: result.sessionId,
        type: data.type,
        amount: data.amount,
        description: data.description,
      },
    });

    revalidatePath("/caja", "layout");
    revalidatePath("/cajas");
    return { ok: true, data: { id: result.movementId } };
  } catch (err) {
    console.error("[addCashMovement]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo registrar el movimiento",
    };
  }
}

export async function closeCashSession(
  input: CloseCashSessionInput,
): Promise<ActionResult<{ id: string; difference: number }>> {
  const session = await requireSession();

  const parsed = closeCashSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const notes = data.notes && data.notes.trim() !== "" ? data.notes : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const active = await tx.cashSession.findFirst({
        where: { userId: session.user.id, status: "OPEN" },
        include: { movements: true },
      });
      if (!active) {
        throw new Error("No tienes una caja abierta");
      }

      // Recalcular esperado desde apertura + movimientos (safety check vs el campo persistido)
      const opening = Number(active.openingAmount);
      const movementsDelta = active.movements.reduce(
        (acc, m) => acc + signedDelta(m.type, Number(m.amount)),
        0,
      );
      const expected = +(opening + movementsDelta).toFixed(2);
      const counted = data.countedAmount;
      const difference = +(counted - expected).toFixed(2);

      const closed = await tx.cashSession.update({
        where: { id: active.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          expectedAmount: expected,
          countedAmount: counted,
          difference,
          notes: notes ?? active.notes,
        },
      });

      return { closed, expected, counted, difference };
    });

    await logAction({
      userId: session.user.id,
      action: "CASH_SESSION_CLOSE",
      entity: "CashSession",
      entityId: result.closed.id,
      before: { status: "OPEN" },
      after: {
        status: "CLOSED",
        expectedAmount: result.expected,
        countedAmount: result.counted,
        difference: result.difference,
        notes,
      },
    });

    // Diferencia ≠ 0 deja registro adicional crítico
    if (Math.abs(result.difference) >= 0.01) {
      await logAction({
        userId: session.user.id,
        action: "CASH_SESSION_CLOSE_WITH_DIFFERENCE",
        entity: "CashSession",
        entityId: result.closed.id,
        after: {
          expected: result.expected,
          counted: result.counted,
          difference: result.difference,
        },
      });
    }

    revalidatePath("/caja", "layout");
    revalidatePath("/cajas");
    revalidatePath("/pos");
    return {
      ok: true,
      data: { id: result.closed.id, difference: result.difference },
    };
  } catch (err) {
    console.error("[closeCashSession]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo cerrar la caja",
    };
  }
}
