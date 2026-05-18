"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CashSessionListItem } from "@/server/queries/cash.queries";

type Store = { id: string; code: string; name: string };

type Props = {
  sessions: CashSessionListItem[];
  stores: Store[];
  selectedStoreId: string | null;
  selectedStatus: "OPEN" | "CLOSED" | null;
  openCount: number;
  closedCount: number;
  startIndex?: number;
};

const ALL_VALUE = "__ALL__";

export function CashSessionsPanel({
  sessions,
  stores,
  selectedStoreId,
  selectedStatus,
  openCount,
  closedCount,
  startIndex = 0,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === ALL_VALUE) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/cajas?${qs}` : "/cajas");
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sesiones abiertas
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {openCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sesiones cerradas (recientes)
            </p>
            <p className="mt-1 text-2xl font-bold">{closedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Diferencias acumuladas
            </p>
            <p className="mt-1 text-2xl font-bold font-mono">
              {formatCurrency(
                sessions.reduce(
                  (acc, s) => acc + (s.difference ? Number(s.difference) : 0),
                  0,
                ),
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            value={selectedStoreId ?? ALL_VALUE}
            onValueChange={(v) => updateParam("storeId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las sucursales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todas las sucursales</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="uppercase">
                    {s.code} — {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={selectedStatus ?? ALL_VALUE}
            onValueChange={(v) => updateParam("status", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              <SelectItem value="OPEN">Abiertas</SelectItem>
              <SelectItem value="CLOSED">Cerradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 w-12 text-center">#</th>
              <th className="px-3 py-3">Caja / Sucursal</th>
              <th className="px-3 py-3">Vendedor</th>
              <th className="px-3 py-3">Apertura</th>
              <th className="px-3 py-3">Cierre</th>
              <th className="px-3 py-3 text-right">Inicial</th>
              <th className="px-3 py-3 text-right">Esperado</th>
              <th className="px-3 py-3 text-right">Contado</th>
              <th className="px-3 py-3 text-right">Diferencia</th>
              <th className="px-3 py-3 text-center">Mov.</th>
              <th className="px-3 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No hay sesiones que coincidan con el filtro.
                </td>
              </tr>
            ) : (
              sessions.map((s, idx) => {
                const diff = s.difference ? Number(s.difference) : null;
                const diffColor =
                  diff === null || Math.abs(diff) < 0.01
                    ? "text-muted-foreground"
                    : diff > 0
                      ? "text-emerald-600"
                      : "text-destructive";
                return (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <p className="uppercase font-medium">
                        {s.cashRegister.name}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {s.cashRegister.store.code} — {s.cashRegister.store.name}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="uppercase">
                        {s.user.firstName} {s.user.lastNameP} {s.user.lastNameM}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {s.user.documentNumber}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateTime(s.openedAt)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateTime(s.closedAt)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(Number(s.openingAmount))}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrency(Number(s.expectedAmount))}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {s.countedAmount !== null
                        ? formatCurrency(Number(s.countedAmount))
                        : "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono ${diffColor}`}
                    >
                      {diff !== null
                        ? `${diff > 0 ? "+" : ""}${formatCurrency(diff)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {s._count.movements}
                      {s._count.sales > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({s._count.sales} v.)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant={s.status === "OPEN" ? "success" : "secondary"}
                      >
                        {s.status === "OPEN" ? "Abierta" : "Cerrada"}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
