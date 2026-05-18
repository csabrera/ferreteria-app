import Image from "next/image";
import Link from "next/link";
import { Package, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/shared/stock-badge";
import { formatQuantity } from "@/lib/format";
import type { StockListItem } from "@/server/queries/stock.queries";

type Props = {
  stocks: StockListItem[];
  startIndex?: number;
};

export function StockTable({ stocks, startIndex = 0 }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-3 w-12 text-center">#</th>
            <th className="px-3 py-3 w-12">Img</th>
            <th className="px-3 py-3">SKU / Producto</th>
            <th className="px-3 py-3">Categoría</th>
            <th className="px-3 py-3">Sucursal</th>
            <th className="px-3 py-3 text-right">Cantidad</th>
            <th className="px-3 py-3 text-right">Mínimo</th>
            <th className="px-3 py-3 text-center">Estado</th>
            <th className="px-3 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {stocks.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-muted-foreground">
                No hay stock que coincida con los filtros.
              </td>
            </tr>
          ) : (
            stocks.map((s, idx) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                  {startIndex + idx + 1}
                </td>
                <td className="px-3 py-2">
                  {s.product.images[0] ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded border bg-muted">
                      <Image
                        src={s.product.images[0]}
                        alt={s.product.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted text-muted-foreground">
                      <Package className="h-4 w-4" />
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="font-mono text-xs text-muted-foreground">
                    {s.product.sku}
                  </div>
                  <Link
                    href={`/productos/${s.product.id}`}
                    className="font-medium uppercase hover:text-primary hover:underline"
                  >
                    {s.product.name}
                  </Link>
                </td>
                <td className="px-3 py-2 uppercase text-muted-foreground">
                  {s.product.category.name}
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono font-medium">{s.store.code}</span>
                  <span className="ml-2 uppercase text-muted-foreground">
                    {s.store.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatQuantity(s.quantity)}{" "}
                  <span className="text-xs text-muted-foreground">
                    {s.product.baseUnit.symbol}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                  {s.minStock > 0 ? formatQuantity(s.minStock) : "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  <StockBadge quantity={s.quantity} minStock={s.minStock} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    title="Ver kardex"
                  >
                    <Link href={`/inventario/kardex/${s.product.id}`}>
                      <History className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
