"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import { storeSchema, type StoreInput } from "@/schemas/store.schema";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = typeof v === "string" && v.trim() === "" ? null : v;
  }
  return result as T;
}

export async function createStore(input: StoreInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const store = await prisma.$transaction(async (tx) => {
      const created = await tx.store.create({
        data: emptyToNull(parsed.data),
      });
      // Auto-creación: cada sucursal nace con su "Caja 1"
      await tx.cashRegister.create({
        data: { storeId: created.id, name: "Caja 1" },
      });
      return created;
    });

    await logAction({
      userId: session.user.id,
      action: "STORE_CREATE",
      entity: "Store",
      entityId: store.id,
      after: store,
    });

    revalidatePath("/sucursales");
    revalidatePath("/", "layout");
    return { ok: true, data: { id: store.id } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `Ya existe una sucursal con el código "${parsed.data.code}"` };
    }
    console.error("[createStore]", err);
    return { ok: false, error: "No se pudo crear la sucursal" };
  }
}

export async function updateStore(
  id: string,
  input: StoreInput,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const before = await prisma.store.findUnique({ where: { id } });
    if (!before) return { ok: false, error: "Sucursal no encontrada" };

    const after = await prisma.store.update({
      where: { id },
      data: emptyToNull(parsed.data),
    });

    await logAction({
      userId: session.user.id,
      action: "STORE_UPDATE",
      entity: "Store",
      entityId: id,
      before,
      after,
    });

    revalidatePath("/sucursales");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `El código "${parsed.data.code}" ya está en uso` };
    }
    console.error("[updateStore]", err);
    return { ok: false, error: "No se pudo actualizar la sucursal" };
  }
}

export async function toggleStoreActive(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.store.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Sucursal no encontrada" };

  // Regla: no puede quedar cero sucursales activas
  if (before.isActive) {
    const activeCount = await prisma.store.count({ where: { isActive: true } });
    if (activeCount <= 1) {
      return {
        ok: false,
        error: "Debe existir al menos una sucursal activa en el sistema",
      };
    }
  }

  const after = await prisma.store.update({
    where: { id },
    data: { isActive: !before.isActive },
  });

  await logAction({
    userId: session.user.id,
    action: after.isActive ? "STORE_ACTIVATE" : "STORE_DEACTIVATE",
    entity: "Store",
    entityId: id,
    before,
    after,
  });

  revalidatePath("/sucursales");
  revalidatePath("/", "layout");
  return { ok: true };
}
