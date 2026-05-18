"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import {
  productUnitSchema,
  type ProductUnitInput,
} from "@/schemas/product-unit.schema";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function createProductUnit(
  productId: string,
  input: ProductUnitInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = productUnitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const barcode = data.barcode && data.barcode.trim() !== "" ? data.barcode : null;

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Si esta nueva presentación será default, quitar default a las demás
      if (data.isDefault) {
        await tx.productUnit.updateMany({
          where: { productId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.productUnit.create({
        data: {
          productId,
          unitId: data.unitId,
          factor: data.factor,
          salePrice: data.salePrice,
          barcode,
          isDefault: data.isDefault,
        },
      });
    });

    await logAction({
      userId: session.user.id,
      action: "PRODUCT_UNIT_CREATE",
      entity: "ProductUnit",
      entityId: created.id,
      after: created,
    });

    revalidatePath(`/productos/${productId}`);
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: "Ya existe una presentación con esa unidad o código de barras",
      };
    }
    console.error("[createProductUnit]", err);
    return { ok: false, error: "No se pudo crear la presentación" };
  }
}

export async function updateProductUnit(
  id: string,
  input: ProductUnitInput,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = productUnitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const before = await prisma.productUnit.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Presentación no encontrada" };

  const data = parsed.data;
  const barcode = data.barcode && data.barcode.trim() !== "" ? data.barcode : null;

  try {
    const after = await prisma.$transaction(async (tx) => {
      // Si se está marcando como default, quitar default a las demás
      if (data.isDefault && !before.isDefault) {
        await tx.productUnit.updateMany({
          where: { productId: before.productId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Si se está quitando isDefault, validar que haya OTRA default
      if (!data.isDefault && before.isDefault) {
        const otherDefault = await tx.productUnit.findFirst({
          where: {
            productId: before.productId,
            isDefault: true,
            NOT: { id },
          },
        });
        if (!otherDefault) {
          throw new Error(
            "Debe existir al menos una presentación marcada como predeterminada",
          );
        }
      }

      return tx.productUnit.update({
        where: { id },
        data: {
          unitId: data.unitId,
          factor: data.factor,
          salePrice: data.salePrice,
          barcode,
          isDefault: data.isDefault,
        },
      });
    });

    await logAction({
      userId: session.user.id,
      action: "PRODUCT_UNIT_UPDATE",
      entity: "ProductUnit",
      entityId: id,
      before,
      after,
    });

    revalidatePath(`/productos/${before.productId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message.includes("predeterminada")) {
      return { ok: false, error: err.message };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: "Ya existe una presentación con esa unidad o código de barras",
      };
    }
    console.error("[updateProductUnit]", err);
    return { ok: false, error: "No se pudo actualizar la presentación" };
  }
}

export async function setDefaultProductUnit(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.productUnit.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Presentación no encontrada" };
  if (before.isDefault) return { ok: true };

  await prisma.$transaction(async (tx) => {
    await tx.productUnit.updateMany({
      where: { productId: before.productId, isDefault: true },
      data: { isDefault: false },
    });
    await tx.productUnit.update({
      where: { id },
      data: { isDefault: true },
    });
  });

  await logAction({
    userId: session.user.id,
    action: "PRODUCT_UNIT_SET_DEFAULT",
    entity: "ProductUnit",
    entityId: id,
    before,
  });

  revalidatePath(`/productos/${before.productId}`);
  return { ok: true };
}

export async function deleteProductUnit(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.productUnit.findUnique({
    where: { id },
    include: { _count: { select: { saleItems: true } } },
  });
  if (!before) return { ok: false, error: "Presentación no encontrada" };

  if (before.isDefault) {
    return {
      ok: false,
      error:
        "No puedes eliminar la presentación predeterminada. Marca otra como predeterminada primero.",
    };
  }

  if (before._count.saleItems > 0) {
    return {
      ok: false,
      error: `Esta presentación tiene ${before._count.saleItems} venta(s) registrada(s) y no puede eliminarse.`,
    };
  }

  await prisma.productUnit.delete({ where: { id } });

  await logAction({
    userId: session.user.id,
    action: "PRODUCT_UNIT_DELETE",
    entity: "ProductUnit",
    entityId: id,
    before,
  });

  revalidatePath(`/productos/${before.productId}`);
  return { ok: true };
}
