import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve la sesión OPEN del usuario, o null si no tiene.
 * Memoizado por request — usar libremente para guards y headers.
 */
export const getActiveCashSession = cache(async (userId: string) => {
  return prisma.cashSession.findFirst({
    where: { userId, status: "OPEN" },
    include: {
      cashRegister: { include: { store: true } },
    },
  });
});

/**
 * Última sesión del usuario sin importar status. Útil para /ventas: si no hay
 * OPEN, devolvemos la última CLOSED para que el vendor pueda ver lo que vendió.
 */
export async function getLatestCashSessionForUser(userId: string) {
  return prisma.cashSession.findFirst({
    where: { userId },
    orderBy: { openedAt: "desc" },
    include: {
      cashRegister: { include: { store: true } },
    },
  });
}

/** Sesión activa + movimientos del turno, para la página "Mi caja". */
export async function getActiveCashSessionWithMovements(userId: string) {
  return prisma.cashSession.findFirst({
    where: { userId, status: "OPEN" },
    include: {
      cashRegister: { include: { store: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { firstName: true, lastNameP: true, lastNameM: true },
          },
          paymentMethod: { select: { code: true, name: true } },
        },
      },
    },
  });
}

/** Cajas en las que el usuario puede operar (su sucursal si es vendor; todas si es admin). */
export async function getCashRegistersForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storeId: true, role: true },
  });
  if (!user) return [];
  const where =
    user.role === "VENDOR" && user.storeId
      ? { storeId: user.storeId, isActive: true }
      : { isActive: true };
  return prisma.cashRegister.findMany({
    where,
    include: {
      store: { select: { id: true, code: true, name: true } },
      sessions: {
        where: { status: "OPEN" },
        select: {
          id: true,
          userId: true,
          user: { select: { firstName: true, lastNameP: true } },
        },
        take: 1,
      },
    },
    orderBy: [{ store: { code: "asc" } }, { name: "asc" }],
  });
}

export const CASH_SESSIONS_PAGE_SIZE = 10;

/** Listado para el dashboard admin de /caja, paginado. */
export async function listCashSessionsForAdmin(
  filters: {
    storeId?: string | null;
    status?: "OPEN" | "CLOSED" | null;
  } = {},
  opts: { page?: number; pageSize?: number } = {},
) {
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.storeId
      ? { cashRegister: { storeId: filters.storeId } }
      : {}),
  };
  const pageSize = Math.max(
    1,
    Math.min(opts.pageSize ?? CASH_SESSIONS_PAGE_SIZE, 200),
  );
  const requestedPage = Math.max(1, opts.page ?? 1);

  const total = await prisma.cashSession.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const items = await prisma.cashSession.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastNameP: true,
          lastNameM: true,
          documentNumber: true,
        },
      },
      cashRegister: {
        include: { store: { select: { id: true, code: true, name: true } } },
      },
      _count: { select: { movements: true, sales: true } },
    },
    orderBy: [{ status: "asc" }, { openedAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize, totalPages };
}

export type ActiveCashSession = NonNullable<
  Awaited<ReturnType<typeof getActiveCashSessionWithMovements>>
>;

export type CashRegisterForUser = Awaited<
  ReturnType<typeof getCashRegistersForUser>
>[number];

export type CashSessionListItem = Awaited<
  ReturnType<typeof listCashSessionsForAdmin>
>["items"][number];
