"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Lock, Printer, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PrintFrame } from "@/components/pos/print-frame";
import type { SaleListItem } from "@/server/queries/sale.queries";

type Props = {
  sales: SaleListItem[];
  cashRegisterLabel: string;
  /** true si la sesión está OPEN; false si CLOSED o si no hay turnos. */
  isCurrent: boolean;
  /** Fecha de cierre si la sesión está CLOSED. */
  sessionClosedAt: Date | string | null;
};

export function MySalesPanel({
  sales,
  cashRegisterLabel,
  isCurrent,
  sessionClosedAt,
}: Props) {
  const [printSaleId, setPrintSaleId] = useState<string | null>(null);
  const [printNonce, setPrintNonce] = useState(0);

  function reprint(saleId: string) {
    setPrintSaleId(saleId);
    setPrintNonce((n) => n + 1);
  }

  const completed = sales.filter((s) => s.status === "COMPLETED");
  const voided = sales.filter((s) => s.status === "VOIDED");

  const totalCompleted = completed.reduce(
    (acc, s) => acc + Number(s.total),
    0,
  );
  const itemsCompleted = completed.reduce(
    (acc, s) => acc + s._count.items,
    0,
  );
  const avgTicket = completed.length > 0 ? totalCompleted / completed.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Receipt className="h-7 w-7" />
            Mis ventas {isCurrent ? "del turno" : "del último turno"}
          </h1>
          <p className="text-muted-foreground">
            <span className="uppercase font-medium">{cashRegisterLabel}</span>
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={isCurrent ? "/pos" : "/caja/abrir"}>
            {isCurrent ? (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al POS
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Abrir caja
              </>
            )}
          </Link>
        </Button>
      </div>

      {!isCurrent && sales.length > 0 && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Tu caja está <strong>cerrada</strong>
            {sessionClosedAt && (
              <>
                {" "}desde el {formatDateTime(sessionClosedAt)}
              </>
            )}
            . Estás viendo el último turno cerrado. Para vender de nuevo,{" "}
            <Link href="/caja/abrir" className="underline">
              abrí una caja
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      {!isCurrent && sales.length === 0 && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            No tenés ventas registradas todavía.{" "}
            <Link href="/caja/abrir" className="underline">
              Abrí una caja
            </Link>{" "}
            para empezar a vender.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Ventas
            </p>
            <p className="mt-1 text-2xl font-bold">{completed.length}</p>
            {voided.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                + {voided.length} anuladas
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Ítems vendidos
            </p>
            <p className="mt-1 text-2xl font-bold">{itemsCompleted}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Total recaudado
            </p>
            <p className="mt-1 text-2xl font-bold font-mono text-primary">
              {formatCurrency(totalCompleted)}
            </p>
            {completed.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Promedio: {formatCurrency(avgTicket)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 w-12 text-center">#</th>
              <th className="px-3 py-3">Hora</th>
              <th className="px-3 py-3">Código</th>
              <th className="px-3 py-3 text-center">Ítems</th>
              <th className="px-3 py-3">Pago</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-center">Estado</th>
              <th className="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-12 text-center text-muted-foreground"
                >
                  No registraste ventas en este turno.
                </td>
              </tr>
            ) : (
              sales.map((s, idx) => {
                const voided = s.status === "VOIDED";
                const payment = s.payments[0];
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-muted/30 ${voided ? "opacity-60" : ""}`}
                  >
                    <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateTime(s.createdAt)}
                    </td>
                    <td className="px-3 py-2 font-mono font-medium">
                      {s.code}
                    </td>
                    <td className="px-3 py-2 text-center">{s._count.items}</td>
                    <td className="px-3 py-2">
                      {payment ? (
                        <>
                          <span className="uppercase">
                            {payment.paymentMethod.name}
                          </span>
                          {payment.reference && (
                            <span className="ml-1 text-xs text-muted-foreground font-mono">
                              ({payment.reference})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {formatCurrency(Number(s.total))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={voided ? "destructive" : "success"}>
                        {voided ? "Anulada" : "Completada"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Ver ticket"
                        >
                          <a
                            href={`/api/ticket/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => reprint(s.id)}
                          disabled={voided}
                          title="Reimprimir"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PrintFrame saleId={printSaleId} nonce={printNonce} />
    </div>
  );
}
