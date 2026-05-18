import Link from "next/link";
import { AlertTriangle, CheckCircle2, Package } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatQuantity } from "@/lib/format";
import type { StockAlert } from "@/server/queries/dashboard.queries";

type Props = {
  alerts: StockAlert[];
};

export function StockAlerts({ alerts }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas de stock
        </CardTitle>
        <CardDescription>
          Productos con stock ≤ mínimo configurado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-50" />
            <p>Sin alertas de stock. ¡Todo en orden!</p>
          </div>
        ) : (
          <ul className="divide-y">
            {alerts.map((a) => {
              const out = a.quantity <= 0;
              return (
                <li
                  key={`${a.productId}-${a.storeCode}`}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground">
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image}
                        alt=""
                        className="h-full w-full rounded object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/productos/${a.productId}`}
                      className="block truncate text-sm font-medium uppercase hover:underline"
                    >
                      {a.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{a.sku}</span>{" "}
                      <span className="uppercase">· {a.storeCode}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={out ? "destructive" : "warning"}>
                      {out ? "Agotado" : "Crítico"}
                    </Badge>
                    <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                      {formatQuantity(a.quantity)} / {formatQuantity(a.minStock)} {a.unitSymbol}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
