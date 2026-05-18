"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { brandSchema, type BrandInput } from "@/schemas/brand.schema";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function makeUniqueBrandSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const baseSlug = slugify(base) || "marca";
  let candidate = baseSlug;
  let i = 1;
  while (true) {
    const existing = await prisma.brand.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    i += 1;
    candidate = `${baseSlug}-${i}`;
  }
}

export async function createBrand(
  input: BrandInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const slug = await makeUniqueBrandSlug(parsed.data.name);
    const created = await prisma.brand.create({
      data: {
        name: parsed.data.name,
        slug,
        logoUrl: parsed.data.logoUrl ?? null,
      },
    });

    await logAction({
      userId: session.user.id,
      action: "BRAND_CREATE",
      entity: "Brand",
      entityId: created.id,
      after: created,
    });

    revalidatePath("/marcas");
    return { ok: true, data: { id: created.id } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `Ya existe una marca con el nombre "${parsed.data.name}"` };
    }
    console.error("[createBrand]", err);
    return { ok: false, error: "No se pudo crear la marca" };
  }
}

export async function updateBrand(
  id: string,
  input: BrandInput,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    const before = await prisma.brand.findUnique({ where: { id } });
    if (!before) return { ok: false, error: "Marca no encontrada" };

    const slug =
      parsed.data.name !== before.name
        ? await makeUniqueBrandSlug(parsed.data.name, id)
        : before.slug;

    const after = await prisma.brand.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug,
        logoUrl: parsed.data.logoUrl ?? null,
      },
    });

    await logAction({
      userId: session.user.id,
      action: "BRAND_UPDATE",
      entity: "Brand",
      entityId: id,
      before,
      after,
    });

    revalidatePath("/marcas");
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: `El nombre "${parsed.data.name}" ya está en uso` };
    }
    console.error("[updateBrand]", err);
    return { ok: false, error: "No se pudo actualizar la marca" };
  }
}

export async function toggleBrandActive(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.brand.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Marca no encontrada" };

  const after = await prisma.brand.update({
    where: { id },
    data: { isActive: !before.isActive },
  });

  await logAction({
    userId: session.user.id,
    action: after.isActive ? "BRAND_ACTIVATE" : "BRAND_DEACTIVATE",
    entity: "Brand",
    entityId: id,
    before,
    after,
  });

  revalidatePath("/marcas");
  return { ok: true };
}
