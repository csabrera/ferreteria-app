"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import {
  inventoryEntrySchema,
  type InventoryEntryInput,
} from "@/schemas/inventory.schema";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function createInventoryEntry(
  input: InventoryEntryInput,
): Promise<ActionResult<{ movementsCreated: number }>> {
  const session = await requireAdmin();

  const parsed = inventoryEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  const reference = data.reference && data.reference.trim() !== "" ? data.reference : null;

  // Validar que el proveedor exista y esté activo
  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
    select: { id: true, isActive: true, businessName: true },
  });
  if (!supplier) {
    return { ok: false, error: "Proveedor no encontrado" };
  }
  if (!supplier.isActive) {
    return { ok: false, error: `El proveedor "${supplier.businessName}" está inactivo` };
  }

  try {
    const priceChanges: { productId: string; before: number; after: number }[] = [];

    const result = await prisma.$transaction(async (tx) => {
      const movementIds: string[] = [];

      for (const item of data.items) {
        // Validar producto existe y está activo
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            isActive: true,
            costPrice: true,
            salePrice: true,
          },
        });
        if (!product) {
          throw new Error(`Producto ${item.productId} no encontrado`);
        }
        if (!product.isActive) {
          throw new Error(`El producto ${item.productId} está inactivo`);
        }

        // UPSERT del Stock para esta sucursal
        const existingStock = await tx.stock.findUnique({
          where: {
            productId_storeId: {
              productId: item.productId,
              storeId: data.storeId,
            },
          },
        });

        const previousQty = existingStock ? Number(existingStock.quantity) : 0;
        const newQty = previousQty + item.quantity;

        if (existingStock) {
          await tx.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: newQty,
              version: { increment: 1 },
            },
          });
        } else {
          await tx.stock.create({
            data: {
              productId: item.productId,
              storeId: data.storeId,
              quantity: newQty,
              minStock: 0,
              version: 1,
            },
          });
        }

        // Calcular costo promedio ponderado global (todas las sucursales)
        const productUpdates: { costPrice?: number; salePrice?: number } = {};
        if (item.unitCost > 0) {
          const aggBefore = await tx.stock.aggregate({
            where: { productId: item.productId },
            _sum: { quantity: true },
          });
          // _sum YA incluye el nuevo stock recién actualizado
          const stockGlobalAfter = Number(aggBefore._sum.quantity ?? 0);
          const stockGlobalBefore = stockGlobalAfter - item.quantity;
          const currentCost = Number(product.costPrice);

          let newAvgCost = item.unitCost;
          if (stockGlobalBefore > 0 && currentCost > 0) {
            newAvgCost =
              (stockGlobalBefore * currentCost + item.quantity * item.unitCost) /
              stockGlobalAfter;
          }
          productUpdates.costPrice = newAvgCost;
        }

        // Actualizar salePrice si el admin lo cambió en la entrada
        const currentSalePrice = Number(product.salePrice);
        if (item.newSalePrice > 0 && item.newSalePrice !== currentSalePrice) {
          productUpdates.salePrice = item.newSalePrice;
          priceChanges.push({
            productId: product.id,
            before: currentSalePrice,
            after: item.newSalePrice,
          });
        }

        if (Object.keys(productUpdates).length > 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: productUpdates,
          });
        }

        // INSERT del movimiento (append-only)
        const movement = await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            storeId: data.storeId,
            type: "ENTRY",
            quantity: item.quantity,
            unitCost: item.unitCost > 0 ? item.unitCost : null,
            previousStock: previousQty,
            newStock: newQty,
            reference,
            supplierId: data.supplierId,
            userId: session.user.id,
          },
        });
        movementIds.push(movement.id);
      }

      return movementIds;
    });

    await logAction({
      userId: session.user.id,
      action: "INVENTORY_ENTRY_CREATE",
      entity: "InventoryMovement",
      entityId: result.join(","),
      after: {
        storeId: data.storeId,
        supplierId: data.supplierId,
        reference,
        itemsCount: data.items.length,
        movementIds: result,
      },
    });

    // Auditoría por cada cambio de precio de venta
    for (const change of priceChanges) {
      await logAction({
        userId: session.user.id,
        action: "PRODUCT_SALE_PRICE_UPDATE_VIA_ENTRY",
        entity: "Product",
        entityId: change.productId,
        before: { salePrice: change.before },
        after: { salePrice: change.after },
      });
    }

    revalidatePath("/inventario");
    revalidatePath("/productos");
    return { ok: true, data: { movementsCreated: result.length } };
  } catch (err) {
    console.error("[createInventoryEntry]", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo registrar la entrada",
    };
  }
}
