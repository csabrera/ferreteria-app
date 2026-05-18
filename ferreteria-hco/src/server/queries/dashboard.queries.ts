import { prisma } from "@/lib/prisma";
import { formatInTimeZone } from "date-fns-tz";
import { subDays } from "date-fns";

const TZ = "America/Lima";

/**
 * Devuelve el rango UTC que corresponde a [startOfDay..endOfDay] en zona Lima
 * para una fecha dada. Calcular el día en Lima (no UTC) es clave para que
 * "hoy" coincida con la percepción del usuario.
 */
function limaDayRange(date: Date): { from: Date; to: Date } {
  const ymd = formatInTimeZone(date, TZ, "yyyy-MM-dd");
  // Lima es UTC-5 fijo (no usa horario de verano). Día Lima 00:00 = UTC 05:00
  const from = new Date(`${ymd}T05:00:00.000Z`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

type StoreFilter = { storeId?: string | null };

function storeWhere(filter: StoreFilter): { storeId?: string } {
  return filter.storeId ? { storeId: filter.storeId } : {};
}

/** KPIs principales: ventas hoy, tickets hoy, ticket promedio, stock crítico. Con delta vs ayer. */
export async function getDashboardKpis(filter: StoreFilter = {}) {
  const now = new Date();
  const today = limaDayRange(now);
  const yesterday = limaDayRange(subDays(now, 1));
  const where = storeWhere(filter);

  const [
    todaySales,
    yesterdaySales,
    criticalStock,
    activeOpenSessions,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        ...where,
        status: "COMPLETED",
        createdAt: { gte: today.from, lt: today.to },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.sale.aggregate({
      where: {
        ...where,
        status: "COMPLETED",
        createdAt: { gte: yesterday.from, lt: yesterday.to },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    // Productos con stock por debajo del mínimo configurado
    prisma.stock.count({
      where: {
        ...where,
        minStock: { gt: 0 },
        quantity: { lte: prisma.stock.fields.minStock },
        product: { isActive: true },
      },
    }),
    // Cajas OPEN
    prisma.cashSession.count({
      where: {
        status: "OPEN",
        ...(filter.storeId
          ? { cashRegister: { storeId: filter.storeId } }
          : {}),
      },
    }),
  ]);

  const todayTotal = Number(todaySales._sum.total ?? 0);
  const yesterdayTotal = Number(yesterdaySales._sum.total ?? 0);
  const todayTickets = todaySales._count._all;
  const yesterdayTickets = yesterdaySales._count._all;

  const todayAvg = todayTickets > 0 ? todayTotal / todayTickets : 0;
  const yesterdayAvg = yesterdayTickets > 0 ? yesterdayTotal / yesterdayTickets : 0;

  return {
    totalToday: +todayTotal.toFixed(2),
    totalYesterday: +yesterdayTotal.toFixed(2),
    ticketsToday: todayTickets,
    ticketsYesterday: yesterdayTickets,
    avgTicketToday: +todayAvg.toFixed(2),
    avgTicketYesterday: +yesterdayAvg.toFixed(2),
    criticalStockCount: criticalStock,
    activeCashSessions: activeOpenSessions,
  };
}

/** Ventas agrupadas por día de los últimos N días (Lima TZ). */
export async function getSalesLastDays(filter: StoreFilter = {}, days = 7) {
  const now = new Date();
  const startRange = limaDayRange(subDays(now, days - 1)).from;
  const where = storeWhere(filter);

  const sales = await prisma.sale.findMany({
    where: {
      ...where,
      status: "COMPLETED",
      createdAt: { gte: startRange },
    },
    select: { createdAt: true, total: true },
    orderBy: { createdAt: "asc" },
  });

  // Agrupar por día Lima
  const byDay = new Map<string, { total: number; count: number }>();
  for (const s of sales) {
    const key = formatInTimeZone(s.createdAt, TZ, "yyyy-MM-dd");
    const prev = byDay.get(key) ?? { total: 0, count: 0 };
    byDay.set(key, {
      total: prev.total + Number(s.total),
      count: prev.count + 1,
    });
  }

  // Generar array completo de N días (rellenar huecos con 0)
  const result: { date: string; label: string; total: number; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = formatInTimeZone(d, TZ, "yyyy-MM-dd");
    const data = byDay.get(key) ?? { total: 0, count: 0 };
    result.push({
      date: key,
      label: formatInTimeZone(d, TZ, "dd/MM"),
      total: +data.total.toFixed(2),
      count: data.count,
    });
  }
  return result;
}

/** Top productos vendidos (por cantidad) en los últimos N días. */
export async function getTopProducts(
  filter: StoreFilter = {},
  days = 7,
  limit = 5,
) {
  const now = new Date();
  const startRange = limaDayRange(subDays(now, days - 1)).from;

  // Agregamos sobre SaleItem cruzando con Sale para filtrar por store/fecha
  const items = await prisma.saleItem.findMany({
    where: {
      sale: {
        status: "COMPLETED",
        createdAt: { gte: startRange },
        ...(filter.storeId ? { storeId: filter.storeId } : {}),
      },
    },
    select: {
      productId: true,
      quantity: true,
      lineTotal: true,
      product: { select: { name: true, sku: true } },
    },
  });

  const byProduct = new Map<
    string,
    { name: string; sku: string; qty: number; total: number }
  >();
  for (const it of items) {
    const prev = byProduct.get(it.productId);
    if (prev) {
      prev.qty += Number(it.quantity);
      prev.total += Number(it.lineTotal);
    } else {
      byProduct.set(it.productId, {
        name: it.product.name,
        sku: it.product.sku,
        qty: Number(it.quantity),
        total: Number(it.lineTotal),
      });
    }
  }

  return Array.from(byProduct.entries())
    .map(([productId, v]) => ({
      productId,
      name: v.name,
      sku: v.sku,
      qty: +v.qty.toFixed(3),
      total: +v.total.toFixed(2),
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

/** Productos con stock crítico (qty <= minStock, minStock > 0). */
export async function getStockAlerts(filter: StoreFilter = {}, limit = 10) {
  // Postgres soporta comparación entre columnas via prisma.stock.fields
  const stocks = await prisma.stock.findMany({
    where: {
      ...storeWhere(filter),
      minStock: { gt: 0 },
      quantity: { lte: prisma.stock.fields.minStock },
      product: { isActive: true },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          baseUnit: { select: { symbol: true } },
          images: true,
        },
      },
      store: { select: { code: true, name: true } },
    },
    orderBy: { quantity: "asc" },
    take: limit,
  });

  return stocks.map((s) => ({
    productId: s.product.id,
    name: s.product.name,
    sku: s.product.sku,
    image: s.product.images[0] ?? null,
    unitSymbol: s.product.baseUnit.symbol,
    storeCode: s.store.code,
    storeName: s.store.name,
    quantity: Number(s.quantity),
    minStock: Number(s.minStock),
  }));
}

/** Estado de las cajas: agrupado por sucursal con sesiones OPEN y resumen. */
export async function getCashStatusByStore(filter: StoreFilter = {}) {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      ...(filter.storeId ? { id: filter.storeId } : {}),
    },
    select: {
      id: true,
      code: true,
      name: true,
      cashRegisters: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          sessions: {
            where: { status: "OPEN" },
            take: 1,
            select: {
              id: true,
              openedAt: true,
              expectedAmount: true,
              user: {
                select: { firstName: true, lastNameP: true },
              },
            },
          },
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return stores.map((s) => {
    const registers = s.cashRegisters.map((r) => {
      const open = r.sessions[0];
      return {
        registerId: r.id,
        registerName: r.name,
        isOpen: !!open,
        openedAt: open?.openedAt ?? null,
        expectedAmount: open ? Number(open.expectedAmount) : 0,
        vendor: open
          ? `${open.user.firstName} ${open.user.lastNameP}`
          : null,
      };
    });
    return {
      storeId: s.id,
      storeCode: s.code,
      storeName: s.name,
      registers,
      openCount: registers.filter((r) => r.isOpen).length,
      totalCount: registers.length,
    };
  });
}

export type DashboardKpis = Awaited<ReturnType<typeof getDashboardKpis>>;
export type SalesByDay = Awaited<ReturnType<typeof getSalesLastDays>>[number];
export type TopProduct = Awaited<ReturnType<typeof getTopProducts>>[number];
export type StockAlert = Awaited<ReturnType<typeof getStockAlerts>>[number];
export type CashStatusStore = Awaited<
  ReturnType<typeof getCashStatusByStore>
>[number];
