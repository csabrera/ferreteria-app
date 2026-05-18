import { getStores } from "@/server/queries/store.queries";
import { StoresPanel } from "./_components/stores-panel";

export default async function SucursalesPage() {
  const stores = await getStores();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sucursales</h1>
          <p className="text-muted-foreground">
            Gestiona los locales del negocio. Al crear una sucursal se crea
            automáticamente su &ldquo;Caja 1&rdquo;.
          </p>
        </div>
      </div>

      <StoresPanel stores={stores} />
    </div>
  );
}
