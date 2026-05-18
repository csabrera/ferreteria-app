import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type LogActionInput = {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Crea un registro en AuditLog. Acción crítica obligatoria en:
 * settings update, stock adjustment, sale void, user create/disable,
 * cash session close con diferencia, price change.
 */
export async function logAction(input: LogActionInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before:
        input.before === undefined
          ? Prisma.DbNull
          : (input.before as Prisma.InputJsonValue),
      after:
        input.after === undefined
          ? Prisma.DbNull
          : (input.after as Prisma.InputJsonValue),
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
