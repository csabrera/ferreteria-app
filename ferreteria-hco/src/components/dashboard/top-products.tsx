import { Package } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatQuantity } from "@/lib/format";
import type { TopProduct } from "@/server/queries/dashboard.queries";

type Props = {
  products: TopProduct[];
  days: number;
};

export function TopProducts({ products, days }: Props) {
  const maxQty = products[0]?.qty ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top productos</CardTitle>
        <CardDescription>
          Más vendidos en los últimos {days} días (por cantidad)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Package className="h-8 w-8 opacity-30" />
            <p>Sin ventas en el período.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {products.map((p, idx) => {
              const pct = maxQty > 0 ? (p.qty / maxQty) * 100 : 0;
              return (
                <li key={p.productId} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {idx + 1}.
                      </span>
                      <span className="truncate font-medium uppercase">
                        {p.name}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatCurrency(p.total)}
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-right text-xs font-mono text-muted-foreground">
                    {formatQuantity(p.qty)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
