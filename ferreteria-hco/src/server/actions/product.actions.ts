"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import { productSchema, type ProductInput } from "@/schemas/product.schema";
import { generateUniqueSku } from "@/server/queries/product.queries";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function uniqueViolationMessage(target: unknown): string | null {
  if (typeof target !== "object" || target === null) return null;
  const fields = Array.isArray((target as { fields?: unknown }).fields)
    ? ((target as { fields: string[] }).fields)
    : null;
  if (!fields) return null;
  if (fields.includes("sku")) return "Ya existe un producto con ese SKU";
  if (fields.includes("barcode"))
    return "Ya existe un producto con ese código de barras";
  return null;
}

export async function createProduct(
  input: ProductInput,
): Promise<ActionResult<{ id: string; sku: string }>> {
  const session = await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const sku = data.sku && data.sku.trim() !== "" ? data.sku : await generateUniqueSku();
  const barcode = data.barcode && data.barcode.trim() !== "" ? data.barcode : null;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku,
          barcode,
          name: data.name,
          description: data.description && data.description.trim() !== "" ? data.description : null,
          categoryId: data.categoryId,
          brandId: data.brandId,
          baseUnitId: data.baseUnitId,
          images: data.images,
          // costPrice se inicializa en 0 — se actualiza al recibir la primera entrada
          costPrice: 0,
          salePrice: data.salePrice,
        },
      });

      // Auto-crear la presentación base (factor=1, isDefault=true)
      await tx.productUnit.create({
        data: {
          productId: product.id,
          unitId: data.baseUnitId,
          factor: 1,
          salePrice: data.salePrice,
          isDefault: true,
        },
      });

      return product;
    });

    await logAction({
      userId: session.user.id,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: created.id,
      after: created,
    });

    revalidatePath("/productos");
    return { ok: true, data: { id: created.id, sku: created.sku } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const msg = uniqueViolationMessage(err.meta?.target);
      return { ok: false, error: msg ?? "Violación de unicidad" };
    }
    console.error("[createProduct]", err);
    return { ok: false, error: "No se pudo crear el producto" };
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const barcode = data.barcode && data.barcode.trim() !== "" ? data.barcode : null;

  try {
    const before = await prisma.product.findUnique({ where: { id } });
    if (!before) return { ok: false, error: "Producto no encontrado" };

    const after = await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku && data.sku.trim() !== "" ? data.sku : before.sku,
        barcode,
        name: data.name,
        description: data.description && data.description.trim() !== "" ? data.description : null,
        categoryId: data.categoryId,
        brandId: data.brandId,
        baseUnitId: data.baseUnitId,
        images: data.images,
        // costPrice NO se actualiza desde el form — se maneja vía entradas de mercadería
        salePrice: data.salePrice,
      },
    });

    await logAction({
      userId: session.user.id,
      action: "PRODUCT_UPDATE",
      entity: "Product",
      entityId: id,
      before,
      after,
    });

    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const msg = uniqueViolationMessage(err.meta?.target);
      return { ok: false, error: msg ?? "Violación de unicidad" };
    }
    console.error("[updateProduct]", err);
    return { ok: false, error: "No se pudo actualizar el producto" };
  }
}

export async function toggleProductActive(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.product.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Producto no encontrado" };

  const after = await prisma.product.update({
    where: { id },
    data: { isActive: !before.isActive },
  });

  await logAction({
    userId: session.user.id,
    action: after.isActive ? "PRODUCT_ACTIVATE" : "PRODUCT_DEACTIVATE",
    entity: "Product",
    entityId: id,
    before,
    after,
  });

  revalidatePath("/productos");
  return { ok: true };
}
