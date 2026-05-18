"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { categorySchema, type CategoryInput } from "@/schemas/category.schema";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Verifica que asignar `newParentId` a la categoría `categoryId` no genere
 * un ciclo en el árbol (categoría no puede ser ancestro de sí misma).
 */
async function wouldCreateCycle(
  categoryId: string,
  newParentId: string,
): Promise<boolean> {
  if (categoryId === newParentId) return true;
  let currentId: string | null = newParentId;
  const visited = new Set<string>();
  while (currentId) {
    if (currentId === categoryId) return true;
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    const parent: { parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
    currentId = parent?.parentId ?? null;
  }
  return false;
}

/**
 * Genera un slug único agregando -2, -3, etc. si ya existe.
 */
async function makeUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(base) || "categoria";
  let candidate = baseSlug;
  let i = 1;
  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
}

export async function createCategory(
  input: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const slug = await makeUniqueSlug(parsed.data.name);
    const created = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug,
        parentId: parsed.data.parentId,
        imageUrl: parsed.data.imageUrl ?? null,
      },
    });

    await logAction({
      userId: session.user.id,
      action: "CATEGORY_CREATE",
      entity: "Category",
      entityId: created.id,
      after: created,
    });

    revalidatePath("/categorias");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    console.error("[createCategory]", err);
    return { ok: false, error: "No se pudo crear la categoría" };
  }
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Categoría no encontrada" };

  // Detectar ciclos al cambiar parentId
  if (parsed.data.parentId && parsed.data.parentId !== before.parentId) {
    if (await wouldCreateCycle(id, parsed.data.parentId)) {
      return {
        ok: false,
        error: "No puedes asignar como padre a esta categoría o a una de sus descendientes",
      };
    }
  }

  try {
    // Re-slug solo si el nombre cambió
    const slug =
      parsed.data.name !== before.name
        ? await makeUniqueSlug(parsed.data.name, id)
        : before.slug;

    const after = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug,
        parentId: parsed.data.parentId,
        imageUrl: parsed.data.imageUrl ?? null,
      },
    });

    await logAction({
      userId: session.user.id,
      action: "CATEGORY_UPDATE",
      entity: "Category",
      entityId: id,
      before,
      after,
    });

    revalidatePath("/categorias");
    return { ok: true };
  } catch (err) {
    console.error("[updateCategory]", err);
    return { ok: false, error: "No se pudo actualizar la categoría" };
  }
}

export async function toggleCategoryActive(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.category.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Categoría no encontrada" };

  // Si tiene hijos activos, advertir
  if (before.isActive) {
    const activeChildren = await prisma.category.count({
      where: { parentId: id, isActive: true },
    });
    if (activeChildren > 0) {
      return {
        ok: false,
        error: `No puedes desactivar: tiene ${activeChildren} subcategoría(s) activa(s). Desactívalas primero.`,
      };
    }
  }

  const after = await prisma.category.update({
    where: { id },
    data: { isActive: !before.isActive },
  });

  await logAction({
    userId: session.user.id,
    action: after.isActive ? "CATEGORY_ACTIVATE" : "CATEGORY_DEACTIVATE",
    entity: "Category",
    entityId: id,
    before,
    after,
  });

  revalidatePath("/categorias");
  return { ok: true };
}
