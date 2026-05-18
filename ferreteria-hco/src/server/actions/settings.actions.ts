"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { logAction } from "@/lib/audit";
import {
  identitySchema,
  appearanceSchema,
  ticketSchema,
  operationsSchema,
  type IdentityInput,
  type AppearanceInput,
  type TicketInput,
  type OperationsInput,
} from "@/schemas/settings.schema";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Convierte cadenas vacías y solo-espacios a `null`. Útil para campos
 * opcionales en BD donde queremos `NULL` en lugar de "".
 */
function emptyStringToNull<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = typeof v === "string" && v.trim() === "" ? null : v;
  }
  return result as T;
}

async function applyUpdate(
  section: string,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const session = await requireAdmin();

  const cleanData = emptyStringToNull(data);

  const before = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const after = await prisma.appSettings.update({
    where: { id: 1 },
    data: { ...cleanData, updatedById: session.user.id },
  });

  await logAction({
    userId: session.user.id,
    action: `SETTINGS_${section.toUpperCase()}_UPDATE`,
    entity: "AppSettings",
    entityId: "1",
    before,
    after,
  });

  // Recarga el layout para que SettingsProvider relea AppSettings
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateIdentity(input: IdentityInput): Promise<ActionResult> {
  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  return applyUpdate("identity", parsed.data);
}

export async function updateAppearance(
  input: AppearanceInput,
): Promise<ActionResult> {
  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  return applyUpdate("appearance", parsed.data);
}

export async function updateTicket(input: TicketInput): Promise<ActionResult> {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  return applyUpdate("ticket", parsed.data);
}

export async function updateOperations(
  input: OperationsInput,
): Promise<ActionResult> {
  const parsed = operationsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  return applyUpdate("operations", parsed.data);
}
