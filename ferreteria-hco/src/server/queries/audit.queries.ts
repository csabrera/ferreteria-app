import { prisma } from "@/lib/prisma";

export type AuditFilters = {
  userId?: string | null;
  action?: string | null;
  entity?: string | null;
  from?: Date | null;
  to?: Date | null;
};

export const AUDIT_DEFAULT_PAGE_SIZE = 10;

function buildWhere(filters: AuditFilters) {
  return {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.action
      ? { action: { contains: filters.action.toUpperCase() } }
      : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lt: filters.to } : {}),
          },
        }
      : {}),
  };
}

export async function listAuditLogs(
  filters: AuditFilters,
  opts: { page: number; pageSize: number },
) {
  const where = buildWhere(filters);
  const pageSize = Math.max(1, Math.min(opts.pageSize, 200));
  const page = Math.max(1, opts.page);

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastNameP: true,
            documentNumber: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAuditLogById(id: string) {
  return prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastNameP: true,
          lastNameM: true,
          documentNumber: true,
          role: true,
        },
      },
    },
  });
}

/** Entidades posibles que se audita en el sistema (para el filtro). */
export const AUDIT_ENTITIES = [
  "AppSettings",
  "Store",
  "User",
  "Category",
  "Brand",
  "Product",
  "ProductUnit",
  "Supplier",
  "InventoryMovement",
  "CashSession",
  "CashMovement",
  "Sale",
] as const;

export type AuditLogItem = Awaited<
  ReturnType<typeof listAuditLogs>
>["items"][number];

export type AuditLogDetail = NonNullable<
  Awaited<ReturnType<typeof getAuditLogById>>
>;
