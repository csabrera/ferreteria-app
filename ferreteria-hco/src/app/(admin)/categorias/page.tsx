import { getCategories } from "@/server/queries/category.queries";
import { CategoriesPanel } from "./_components/categories-panel";

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground">
          Organiza los productos en categorías y subcategorías. Soporta jerarquía
          ilimitada (ej. Construcción → Cemento → Tipo I).
        </p>
      </div>

      <CategoriesPanel categories={categories} />
    </div>
  );
}
