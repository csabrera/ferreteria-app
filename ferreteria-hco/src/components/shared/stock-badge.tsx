import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  quantity: number;
  minStock: number;
  className?: string;
};

/**
 * Semáforo de stock:
 *   - 0 o negativo → rojo "Agotado"
 *   - ≤ minStock (con minStock > 0) → amarillo "Crítico"
 *   - resto → verde "OK"
 */
export function StockBadge({ quantity, minStock, className }: Props) {
  if (quantity <= 0) {
    return (
      <Badge variant="destructive" className={cn("gap-1", className)}>
        <XCircle className="h-3 w-3" />
        Agotado
      </Badge>
    );
  }
  if (minStock > 0 && quantity <= minStock) {
    return (
      <Badge variant="warning" className={cn("gap-1", className)}>
        <AlertTriangle className="h-3 w-3" />
        Crítico
      </Badge>
    );
  }
  return (
    <Badge variant="success" className={cn("gap-1", className)}>
      <CheckCircle2 className="h-3 w-3" />
      OK
    </Badge>
  );
}
