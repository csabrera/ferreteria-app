import { AlertTriangle, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatQuantity } from "@/lib/format";

type Stock = {
  id: string;
  storeId: string;
  quantity: number;
  minStock: number;
  maxStock: number | null;
  store: { id: string; code: string; name: string };
};

type ProductDetail = {
  baseUnit: { code: string; symbol: string };
  stocks: Stock[];
};

export function ProductStockSection({ product }: { product: ProductDetail }) {
  const total = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock por sucursal</CardTitle>
        <CardDescription>
          Solo lectura. Para registrar entradas o ajustes usa el módulo de
          inventario.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {product.stocks.length === 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Este producto aún no tiene registros de stock en ninguna sucursal.
              Se crean automáticamente al registrar la primera entrada de
              mercadería.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 w-12 text-center">#</th>
                  <th className="px-3 py-2">Sucursal</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-right">Mínimo</th>
                  <th className="px-3 py-2 text-right">Máximo</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {product.stocks.map((s, idx) => {
                  const critical = s.quantity <= s.minStock && s.minStock > 0;
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono font-medium">
                          {s.store.code}
                        </span>
                        <span className="ml-2 uppercase text-muted-foreground">
                          {s.store.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatQuantity(s.quantity)} {product.baseUnit.symbol}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {formatQuantity(s.minStock)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {s.maxStock !== null ? formatQuantity(s.maxStock) : "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {critical ? (
                          <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Crítico
                          </Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/30 font-semibold">
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 uppercase text-xs">Total</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatQuantity(total)} {product.baseUnit.symbol}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
