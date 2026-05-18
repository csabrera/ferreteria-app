import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  /** Valor del período anterior para calcular el delta. Si es 0 y current=0, oculta el delta. */
  previous?: number;
  current?: number;
  /** Formato del delta. "percent" muestra % vs ayer; "absolute" muestra +N */
  deltaMode?: "percent" | "absolute" | "none";
  /** Suffix opcional para acompañar el valor (ej. "productos críticos"). */
  hint?: string;
  /** Highlight visual (card color de acento). */
  highlight?: boolean;
};

export function KpiCard({
  label,
  value,
  previous,
  current,
  deltaMode = "percent",
  hint,
  highlight,
}: Props) {
  const showDelta =
    deltaMode !== "none" &&
    typeof previous === "number" &&
    typeof current === "number" &&
    !(previous === 0 && current === 0);

  let deltaLabel: string | null = null;
  let trend: "up" | "down" | "flat" = "flat";

  if (showDelta) {
    const diff = current - previous;
    if (Math.abs(diff) < 0.005) {
      trend = "flat";
      deltaLabel = "Sin cambio";
    } else {
      trend = diff > 0 ? "up" : "down";
      if (deltaMode === "percent") {
        if (previous === 0) {
          // Evitar división por 0: mostrar "nuevo" para indicar que ayer era 0
          deltaLabel = "Nuevo";
        } else {
          const pct = (diff / previous) * 100;
          deltaLabel = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
        }
      } else {
        deltaLabel = `${diff > 0 ? "+" : ""}${diff}`;
      }
    }
  }

  return (
    <Card className={cn(highlight && "border-primary/40 bg-primary/5")}>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-2xl font-bold font-mono",
            highlight && "text-primary",
          )}
        >
          {value}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {showDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-destructive",
                trend === "flat" && "text-muted-foreground",
              )}
            >
              {trend === "up" && <ArrowUp className="h-3 w-3" />}
              {trend === "down" && <ArrowDown className="h-3 w-3" />}
              {trend === "flat" && <ArrowRight className="h-3 w-3" />}
              {deltaLabel}
            </span>
          )}
          {showDelta && hint && (
            <span className="text-muted-foreground">·</span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
