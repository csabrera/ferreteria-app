"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Lock, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { MOVEMENT_TYPE_LABEL } from "@/schemas/cash.schema";
import type { ActiveCashSession } from "@/server/queries/cash.queries";

import { AddMovementDialog } from "./add-movement-dialog";

const POSITIVE_TYPES = new Set(["INCOME", "DEPOSIT", "SALE"]);

export function CashSessionPanel({ session }: { session: ActiveCashSession }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const opening = Number(session.openingAmount);
  const expected = Number(session.expectedAmount);
  const totalIn = session.movements
    .filter((m) => POSITIVE_TYPES.has(m.type))
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const totalOut = session.movements
    .filter((m) => !POSITIVE_TYPES.has(m.type))
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const movementsCount = session.movements.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi caja</h1>
          <p className="text-muted-foreground">
            <span className="uppercase font-medium">
              {session.cashRegister.name} — {session.cashRegister.store.code}
            </span>
            <span> · Abierta el {formatDateTime(session.openedAt)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo movimiento
          </Button>
          <Button variant="destructive" asChild>
            <Link href="/caja/cerrar">
              <Lock className="mr-2 h-4 w-4" />
              Cerrar caja
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Monto inicial" value={formatCurrency(opening)} />
        <KpiCard
          label="Ingresos del turno"
          value={formatCurrency(totalIn)}
          color="text-emerald-600"
        />
        <KpiCard
          label="Salidas del turno"
          value={formatCurrency(totalOut)}
          color="text-destructive"
        />
        <KpiCard
          label="Saldo esperado"
          value={formatCurrency(expected)}
          highlight
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Movimientos del turno
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({movementsCount})
            </span>
          </CardTitle>
          <CardDescription>
            Cada venta del POS deja aquí un movimiento tipo VENTA. Los ingresos,
            gastos, retiros y depósitos se registran manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">#</th>
                  <th className="px-3 py-2">Hora</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {session.movements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      Sin movimientos todavía.
                    </td>
                  </tr>
                ) : (
                  session.movements.map((m, idx) => {
                    const positive = POSITIVE_TYPES.has(m.type);
                    return (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              m.type === "SALE"
                                ? "default"
                                : positive
                                  ? "success"
                                  : "destructive"
                            }
                          >
                            {MOVEMENT_TYPE_LABEL[m.type] ?? m.type}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          {m.description ?? "—"}
                          {m.paymentMethod && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              · {m.paymentMethod.name}
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-medium ${
                            positive ? "text-emerald-600" : "text-destructive"
                          }`}
                        >
                          {positive ? "+" : "−"}
                          {formatCurrency(Number(m.amount))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddMovementDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : undefined}>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-1 text-2xl font-bold font-mono ${color ?? ""} ${
            highlight ? "text-primary" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
