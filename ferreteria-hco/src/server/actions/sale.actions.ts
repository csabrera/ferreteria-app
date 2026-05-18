"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import {
  createSaleSchema,
  type CreateSaleInput,
  type InsufficientStockLine,
} from "@/schemas/sale.schema";

type CreateSaleResult =
  | { ok: true; data: { id: string; code: string } }
  | { ok: false; error: string; insufficientStock?: InsufficientStockLine[] };

const MAX_CODE_RETRIES = 3;

class SaleError extends Error {
  constructor(
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function createSale(
  input: CreateSaleInput,
): Promise<CreateSaleResult> {
  const session = await requireSession();

  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const notes = data.notes && data.notes.trim() !== "" ? data.notes : null;
  const referenceInput =
    data.payment.reference && data.payment.reference.trim() !== ""
      ? data.payment.reference.trim()
      : null;

  let attempt = 0;
  while (attempt < MAX_CODE_RETRIES) {
    attempt++;
    try {
      const result = await prisma.$transaction(async (tx) => {
        // ──────────────────────────────────────────────────────────
        // 1) Caja OPEN del usuario logueado
        // ──────────────────────────────────────────────────────────
        const active = await tx.cashSession.findFirst({
          where: { userId: session.user.id, status: "OPEN" },
          include: { cashRegister: { include: { store: true } } },
        });
        if (!active) throw new SaleError("NO_OPEN_CASH_SESSION");
        const storeId = active.cashRegister.storeId;
        const storeCode = active.cashRegister.store.code;

        // ──────────────────────────────────────────────────────────
        // 2) Cargar ProductUnits del carrito + computar montos
        // ──────────────────────────────────────────────────────────
        type Line = {
          productUnitId: string;
          productId: string;
          factor: number;
          unitPrice: number;
          quantity: number;
          baseQty: number;
          lineTotal: number;
          productName: string;
          unitSymbol: string;
        };

        const lines: Line[] = [];
        for (const item of data.items) {
          const pu = await tx.productUnit.findUnique({
            where: { id: item.productUnitId },
            include: {
              product: { select: { id: true, name: true, isActive: true } },
              unit: { select: { symbol: true } },
            },
          });
          if (!pu) throw new SaleError("INVALID_PRODUCT_UNIT");
          if (!pu.product.isActive) {
            throw new SaleError(`Producto "${pu.product.name}" no está activo`);
          }
          const factor = Number(pu.factor);
          const unitPrice = Number(pu.salePrice);
          const lineTotal = +(unitPrice * item.quantity).toFixed(2);
          lines.push({
            productUnitId: pu.id,
            productId: pu.product.id,
            factor,
            unitPrice,
            quantity: item.quantity,
            baseQty: item.quantity * factor,
            lineTotal,
            productName: pu.product.name,
            unitSymbol: pu.unit.symbol,
          });
        }

        const subtotal = +lines.reduce((acc, l) => acc + l.lineTotal, 0).toFixed(2);
        const discount = Math.min(Math.max(0, data.discount), subtotal);
        const total = +(subtotal - discount).toFixed(2);

        // ──────────────────────────────────────────────────────────
        // 3) Lock + validación de stock (consolidado por producto)
        // ──────────────────────────────────────────────────────────
        // Consolidar baseQty si el mismo producto vino en N líneas
        const neededByProduct = new Map<string, number>();
        for (const l of lines) {
          neededByProduct.set(
            l.productId,
            (neededByProduct.get(l.productId) ?? 0) + l.baseQty,
          );
        }

        const insufficient: InsufficientStockLine[] = [];
        // Iterar en orden estable por productId para evitar deadlocks
        const productIds = Array.from(neededByProduct.keys()).sort();
        const stockByProduct = new Map<
          string,
          { id: string; quantity: number }
        >();

        for (const productId of productIds) {
          const needed = neededByProduct.get(productId)!;
          // SELECT ... FOR UPDATE — lock pesimista
          const rows = await tx.$queryRaw<
            { id: string; quantity: Prisma.Decimal }[]
          >`
            SELECT id, quantity FROM "Stock"
            WHERE "productId" = ${productId} AND "storeId" = ${storeId}
            FOR UPDATE
          `;
          const row = rows[0];
          const available = row ? Number(row.quantity) : 0;
          if (!row || available < needed) {
            const firstLine = lines.find((l) => l.productId === productId)!;
            insufficient.push({
              productId,
              productUnitId: firstLine.productUnitId,
              productName: firstLine.productName,
              unitSymbol: firstLine.unitSymbol,
              requested: needed,
              available,
            });
          } else {
            stockByProduct.set(productId, {
              id: row.id,
              quantity: available,
            });
          }
        }

        if (insufficient.length > 0) {
          throw new SaleError("INSUFFICIENT_STOCK", insufficient);
        }

        // ──────────────────────────────────────────────────────────
        // 4) Método de pago
        // ──────────────────────────────────────────────────────────
        const paymentMethod = await tx.paymentMethod.findUnique({
          where: { id: data.payment.paymentMethodId },
        });
        if (!paymentMethod || !paymentMethod.isActive) {
          throw new SaleError("Método de pago inválido");
        }
        if (paymentMethod.requiresReference && !referenceInput) {
          throw new SaleError(
            `El método ${paymentMethod.name} requiere número de operación`,
          );
        }
        if (Math.abs(data.payment.amount - total) > 0.005) {
          throw new SaleError(
            `Monto del pago (S/${data.payment.amount.toFixed(2)}) no coincide con el total (S/${total.toFixed(2)})`,
          );
        }

        // ──────────────────────────────────────────────────────────
        // 5) Generar correlativo V-{storeCode}-XXXXXX (MAX+1)
        // ──────────────────────────────────────────────────────────
        const prefix = `V-${storeCode}-`;
        const lastSale = await tx.sale.findFirst({
          where: { storeId, code: { startsWith: prefix } },
          orderBy: { code: "desc" },
          select: { code: true },
        });
        let nextNumber = 1;
        if (lastSale) {
          const m = lastSale.code.match(/(\d+)$/);
          if (m) nextNumber = parseInt(m[1]!, 10) + 1;
        }
        const code = `${prefix}${String(nextNumber).padStart(6, "0")}`;

        // ──────────────────────────────────────────────────────────
        // 6) Sale + SaleItem[] + SalePayment
        // ──────────────────────────────────────────────────────────
        const sale = await tx.sale.create({
          data: {
            code,
            storeId,
            cashSessionId: active.id,
            userId: session.user.id,
            subtotal,
            discount,
            total,
            status: "COMPLETED",
            notes,
          },
        });

        await tx.saleItem.createMany({
          data: lines.map((l) => ({
            saleId: sale.id,
            productId: l.productId,
            productUnitId: l.productUnitId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: 0,
            lineTotal: l.lineTotal,
          })),
        });

        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            paymentMethodId: paymentMethod.id,
            amount: total,
            reference: paymentMethod.requiresReference ? referenceInput : null,
          },
        });

        // ──────────────────────────────────────────────────────────
        // 7) Decrementar stock + InventoryMovement type=SALE (por producto consolidado)
        // ──────────────────────────────────────────────────────────
        for (const productId of productIds) {
          const stockInfo = stockByProduct.get(productId)!;
          const needed = neededByProduct.get(productId)!;
          const newQty = stockInfo.quantity - needed;

          await tx.stock.update({
            where: { id: stockInfo.id },
            data: { quantity: newQty, version: { increment: 1 } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId,
              storeId,
              type: "SALE",
              quantity: needed,
              previousStock: stockInfo.quantity,
              newStock: newQty,
              relatedSaleId: sale.id,
              userId: session.user.id,
            },
          });
        }

        // ──────────────────────────────────────────────────────────
        // 8) CashMovement type=SALE (solo si el método afecta caja)
        // ──────────────────────────────────────────────────────────
        if (paymentMethod.affectsCash) {
          await tx.cashMovement.create({
            data: {
              cashSessionId: active.id,
              type: "SALE",
              amount: total,
              paymentMethodId: paymentMethod.id,
              description: `Venta ${code}`,
              relatedSaleId: sale.id,
              userId: session.user.id,
            },
          });
          await tx.cashSession.update({
            where: { id: active.id },
            data: { expectedAmount: { increment: total } },
          });
        }

        return { saleId: sale.id, code, total };
      });

      // AuditLog fuera de la transaction
      await logAction({
        userId: session.user.id,
        action: "SALE_CREATE",
        entity: "Sale",
        entityId: result.saleId,
        after: { code: result.code, total: result.total },
      });

      revalidatePath("/pos");
      revalidatePath("/ventas");
      revalidatePath("/inventario");
      revalidatePath("/caja", "layout");
      revalidatePath("/cajas");

      return { ok: true, data: { id: result.saleId, code: result.code } };
    } catch (err) {
      if (err instanceof SaleError) {
        if (err.message === "INSUFFICIENT_STOCK") {
          return {
            ok: false,
            error: "Stock insuficiente para completar la venta",
            insufficientStock: err.details as InsufficientStockLine[],
          };
        }
        if (err.message === "NO_OPEN_CASH_SESSION") {
          return { ok: false, error: "No tienes una caja abierta" };
        }
        if (err.message === "INVALID_PRODUCT_UNIT") {
          return { ok: false, error: "Hay una presentación inválida en el carrito" };
        }
        return { ok: false, error: err.message };
      }
      // Conflicto de correlativo: reintentar
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const target = (err.meta as { target?: string[] } | undefined)?.target;
        if (target?.includes("code")) {
          if (attempt >= MAX_CODE_RETRIES) {
            return {
              ok: false,
              error: "Conflicto generando correlativo. Intentá de nuevo.",
            };
          }
          continue; // retry
        }
      }
      console.error("[createSale]", err);
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "No se pudo registrar la venta",
      };
    }
  }

  return { ok: false, error: "No se pudo registrar la venta tras varios intentos" };
}
