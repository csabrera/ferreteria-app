import { getBrands } from "@/server/queries/brand.queries";
import { BrandsPanel } from "./_components/brands-panel";

export default async function MarcasPage() {
  const brands = await getBrands();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
        <p className="text-muted-foreground">
          Gestiona las marcas de los productos (Sodimac, Sika, Cemento Sol,
          etc.). Cada marca puede tener su logo.
        </p>
      </div>

      <BrandsPanel brands={brands} />
    </div>
  );
}
