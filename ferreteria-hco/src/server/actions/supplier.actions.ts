"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import { supplierSchema, type SupplierInput } from "@/schemas/supplier.schema";

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

export async function createSupplier(
  input: SupplierInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const created = await prisma.supplier.create({
      data: emptyToNull(parsed.data),
    });

    await logAction({
      userId: session.user.id,
      action: "SUPPLIER_CREATE",
      entity: "Supplier",
      entityId: created.id,
      after: created,
    });

    revalidatePath("/proveedores");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `Ya existe un proveedor con RUC ${parsed.data.ruc}` };
    }
    console.error("[createSupplier]", err);
    return { ok: false, error: "No se pudo crear el proveedor" };
  }
}

export async function updateSupplier(
  id: string,
  input: SupplierInput,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const before = await prisma.supplier.findUnique({ where: { id } });
    if (!before) return { ok: false, error: "Proveedor no encontrado" };

    const after = await prisma.supplier.update({
      where: { id },
      data: emptyToNull(parsed.data),
    });

    await logAction({
      userId: session.user.id,
      action: "SUPPLIER_UPDATE",
      entity: "Supplier",
      entityId: id,
      before,
      after,
    });

    revalidatePath("/proveedores");
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `El RUC ${parsed.data.ruc} ya está en uso` };
    }
    console.error("[updateSupplier]", err);
    return { ok: false, error: "No se pudo actualizar el proveedor" };
  }
}

export async function toggleSupplierActive(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.supplier.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Proveedor no encontrado" };

  const after = await prisma.supplier.update({
    where: { id },
    data: { isActive: !before.isActive },
  });

  await logAction({
    userId: session.user.id,
    action: after.isActive ? "SUPPLIER_ACTIVATE" : "SUPPLIER_DEACTIVATE",
    entity: "Supplier",
    entityId: id,
    before,
    after,
  });

  revalidatePath("/proveedores");
  return { ok: true };
}
