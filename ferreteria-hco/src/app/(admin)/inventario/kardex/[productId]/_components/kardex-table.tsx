import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MovementType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatQuantity } from "@/lib/format";
import type { KardexMovement } from "@/server/queries/inventory.queries";

type Props = {
  movements: KardexMovement[];
  unitSymbol: string;
  productSku: string;
  startIndex?: number;
};

const TYPE_LABEL: Record<MovementType, string> = {
  ENTRY: "Entrada",
  EXIT: "Salida",
  ADJUSTMENT: "Ajuste",
  TRANSFER_IN: "Transf. entrada",
  TRANSFER_OUT: "Transf. salida",
  SALE: "Venta",
  SALE_VOID: "Venta anulada",
};

const TYPE_VARIANT: Record<MovementType, "default" | "success" | "destructive" | "warning" | "secondary"> = {
  ENTRY: "success",
  EXIT: "destructive",
  ADJUSTMENT: "warning",
  TRANSFER_IN: "success",
  TRANSFER_OUT: "destructive",
  SALE: "secondary",
  SALE_VOID: "warning",
};

function isInflow(type: MovementType) {
  return type === "ENTRY" || type === "TRANSFER_IN" || type === "SALE_VOID";
}

export function KardexTable({ movements, unitSymbol, startIndex = 0 }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-3 w-12 text-center">#</th>
            <th className="px-3 py-3">Fecha</th>
            <th className="px-3 py-3">Tipo</th>
            <th className="px-3 py-3">Sucursal</th>
            <th className="px-3 py-3 text-right">Cantidad</th>
            <th className="px-3 py-3 text-right">Stock anterior</th>
            <th className="px-3 py-3 text-right">Stock nuevo</th>
            <th className="px-3 py-3 text-right">Costo unit.</th>
            <th className="px-3 py-3">Referencia</th>
            <th className="px-3 py-3">Usuario</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {movements.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-12 text-center text-muted-foreground">
                No hay movimientos que coincidan con los filtros.
              </td>
            </tr>
          ) : (
            movements.map((m, idx) => {
              const inflow = isInflow(m.type);
              return (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                    {startIndex + idx + 1}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{format(new Date(m.createdAt), "dd/MM/yyyy", { locale: es })}</div>
                    <div className="text-muted-foreground">
                      {format(new Date(m.createdAt), "HH:mm")}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={TYPE_VARIANT[m.type]}>{TYPE_LABEL[m.type]}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono font-medium">{m.store.code}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    <span className={inflow ? "text-emerald-600" : "text-destructive"}>
                      {inflow ? "+" : "−"}
                      {formatQuantity(m.quantity)} {unitSymbol}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                    {formatQuantity(m.previousStock)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {formatQuantity(m.newStock)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {m.unitCost !== null ? formatCurrency(m.unitCost) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs uppercase text-muted-foreground">
                    {m.reference ?? (m.reasonNote ?? "—")}
                  </td>
                  <td className="px-3 py-2 text-xs uppercase text-muted-foreground">
                    {m.user.firstName} {m.user.lastNameP}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
