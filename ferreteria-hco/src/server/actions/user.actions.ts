"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ResetPasswordInput,
} from "@/schemas/user.schema";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _ph, ...rest } = user;
  return rest;
}

function uniqueViolationMessage(target: unknown): string | null {
  if (typeof target !== "object" || target === null) return null;
  const fields = Array.isArray((target as { fields?: unknown }).fields)
    ? ((target as { fields: string[] }).fields)
    : null;
  if (!fields) return null;
  if (fields.includes("email")) return "Ese email ya está registrado por otro usuario";
  if (fields.includes("documentType") || fields.includes("documentNumber")) {
    return "Ya existe un usuario con ese tipo y número de documento";
  }
  return null;
}

export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<{ id: string; initialPassword: string }>> {
  const session = await requireAdmin();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;
  // Convención: la contraseña inicial es el número de documento.
  const initialPassword = data.documentNumber;
  const passwordHash = await bcrypt.hash(initialPassword, 10);

  try {
    const created = await prisma.user.create({
      data: {
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        passwordHash,
        lastNameP: data.lastNameP,
        lastNameM: data.lastNameM,
        firstName: data.firstName,
        phone: data.phone,
        email: data.email && data.email !== "" ? data.email : null,
        birthDate: data.birthDate,
        address: data.address,
        gender: data.gender,
        role: data.role,
        storeId: data.storeId,
      },
    });

    await logAction({
      userId: session.user.id,
      action: "USER_CREATE",
      entity: "User",
      entityId: created.id,
      after: sanitizeUser(created),
    });

    revalidatePath("/usuarios");
    return { ok: true, data: { id: created.id, initialPassword } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const msg = uniqueViolationMessage(err.meta?.target);
      return { ok: false, error: msg ?? "Violación de unicidad" };
    }
    console.error("[createUser]", err);
    return { ok: false, error: "No se pudo crear el usuario" };
  }
}

export async function updateUser(input: UpdateUserInput): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { id, ...data } = parsed.data;

  try {
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return { ok: false, error: "Usuario no encontrado" };

    const after = await prisma.user.update({
      where: { id },
      data: {
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        lastNameP: data.lastNameP,
        lastNameM: data.lastNameM,
        firstName: data.firstName,
        phone: data.phone,
        email: data.email && data.email !== "" ? data.email : null,
        birthDate: data.birthDate,
        address: data.address,
        gender: data.gender,
        role: data.role,
        storeId: data.storeId,
      },
    });

    await logAction({
      userId: session.user.id,
      action: "USER_UPDATE",
      entity: "User",
      entityId: id,
      before: sanitizeUser(before),
      after: sanitizeUser(after),
    });

    revalidatePath("/usuarios");
    return { ok: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const msg = uniqueViolationMessage(err.meta?.target);
      return { ok: false, error: msg ?? "Violación de unicidad" };
    }
    console.error("[updateUser]", err);
    return { ok: false, error: "No se pudo actualizar el usuario" };
  }
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!user) return { ok: false, error: "Usuario no encontrado" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { passwordHash },
  });

  await logAction({
    userId: session.user.id,
    action: "USER_PASSWORD_RESET",
    entity: "User",
    entityId: parsed.data.id,
    // before/after sin hash por seguridad — solo el evento
  });

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function toggleUserActive(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Usuario no encontrado" };

  // Regla: el admin no se puede desactivar a sí mismo
  if (before.id === session.user.id && before.isActive) {
    return { ok: false, error: "No puedes desactivar tu propio usuario" };
  }

  const after = await prisma.user.update({
    where: { id },
    data: { isActive: !before.isActive },
  });

  await logAction({
    userId: session.user.id,
    action: after.isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE",
    entity: "User",
    entityId: id,
    before: sanitizeUser(before),
    after: sanitizeUser(after),
  });

  revalidatePath("/usuarios");
  return { ok: true };
}
