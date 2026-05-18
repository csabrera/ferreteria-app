import { getSuppliers } from "@/server/queries/supplier.queries";
import { SuppliersPanel } from "./_components/suppliers-panel";

export default async function ProveedoresPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
        <p className="text-muted-foreground">
          Empresas que te surten la mercadería. Cada entrada de inventario debe
          tener un proveedor asociado para la trazabilidad.
        </p>
      </div>

      <SuppliersPanel suppliers={suppliers} />
    </div>
  );
}
