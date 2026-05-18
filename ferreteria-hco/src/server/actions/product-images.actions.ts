"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";

type ActionResult = { ok: true } | { ok: false; error: string };

const imagesSchema = z.array(z.string().min(1)).max(20, "Máximo 20 imágenes");

export async function updateProductImages(
  productId: string,
  images: string[],
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = imagesSchema.safeParse(images);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Imágenes inválidas" };
  }

  const before = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, images: true },
  });
  if (!before) return { ok: false, error: "Producto no encontrado" };

  await prisma.product.update({
    where: { id: productId },
    data: { images: parsed.data },
  });

  await logAction({
    userId: session.user.id,
    action: "PRODUCT_IMAGES_UPDATE",
    entity: "Product",
    entityId: productId,
    before: { images: before.images },
    after: { images: parsed.data },
  });

  revalidatePath("/productos");
  revalidatePath(`/productos/${productId}`);
  return { ok: true };
}
