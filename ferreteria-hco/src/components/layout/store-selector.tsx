import { Store } from "lucide-react";

import { getActiveStores } from "@/server/queries/store.queries";

/**
 * Muestra la sucursal activa. F1:
 *   - 0 sucursales → muestra placeholder (no debería pasar tras el seed)
 *   - 1 sucursal → label estático con su código y nombre
 *   - >1 sucursales → label de la primera (el cambio de contexto se
 *     implementa cuando se necesite filtrar inventario/ventas por sucursal)
 */
export async function StoreSelector() {
  const stores = await getActiveStores();
  const active = stores[0];

  if (!active) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span>Sin sucursales</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
      <Store className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono font-medium">{active.code}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{active.name}</span>
      {stores.length > 1 && (
        <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          +{stores.length - 1}
        </span>
      )}
    </div>
  );
}
