import { Lock } from "lucide-react";

import { getUnits } from "@/server/queries/unit.queries";

export default async function UnidadesPage() {
  const units = await getUnits();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unidades de medida</h1>
        <p className="text-muted-foreground">
          Catálogo cerrado. Cada producto tiene una unidad base y puede tener
          presentaciones adicionales (ej. una caja = 24 unidades).
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Las unidades base no son editables. Cualquier presentación
          (caja×24, fardo×10, etc.) se configura en cada producto desde el
          módulo de Productos.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Símbolo</th>
              <th className="px-4 py-3 text-center">Productos (base)</th>
              <th className="px-4 py-3 text-center">Presentaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {units.map((unit, idx) => (
              <tr key={unit.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                  {idx + 1}
                </td>
                <td className="px-4 py-3 font-mono font-medium">{unit.code}</td>
                <td className="px-4 py-3">{unit.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{unit.symbol}</td>
                <td className="px-4 py-3 text-center">
                  {unit._count.productsAsBase}
                </td>
                <td className="px-4 py-3 text-center">
                  {unit._count.productUnits}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
