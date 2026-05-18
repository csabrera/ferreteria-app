import Link from "next/link";
import { CircleDot, Lock, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CashStatusStore } from "@/server/queries/dashboard.queries";

type Props = {
  stores: CashStatusStore[];
};

export function CashStatus({ stores }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              Estado de cajas
            </CardTitle>
            <CardDescription>
              Cajas abiertas por sucursal en este momento
            </CardDescription>
          </div>
          <Link
            href="/cajas"
            className="text-xs text-primary hover:underline"
          >
            Ver todas →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {stores.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin sucursales activas.
          </p>
        ) : (
          <div className="space-y-4">
            {stores.map((s) => (
              <div key={s.storeId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="font-mono font-medium">{s.storeCode}</span>{" "}
                    <span className="uppercase text-muted-foreground">
                      · {s.storeName}
                    </span>
                  </p>
                  <Badge
                    variant={s.openCount > 0 ? "success" : "secondary"}
                  >
                    {s.openCount}/{s.totalCount} abierta{s.totalCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                {s.registers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Sin cajas registradas
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {s.registers.map((r) => (
                      <li
                        key={r.registerId}
                        className="flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          {r.isOpen ? (
                            <CircleDot className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="uppercase font-medium">
                            {r.registerName}
                          </span>
                          {r.vendor && (
                            <span className="uppercase text-muted-foreground">
                              · {r.vendor}
                            </span>
                          )}
                        </div>
                        {r.isOpen && r.openedAt ? (
                          <div className="text-right">
                            <p className="font-mono font-semibold">
                              {formatCurrency(r.expectedAmount)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              desde {formatDateTime(r.openedAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Cerrada
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
