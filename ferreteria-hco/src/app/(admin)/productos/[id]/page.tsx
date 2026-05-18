import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getProductById } from "@/server/queries/product.queries";
import { getCategories } from "@/server/queries/category.queries";
import { getBrands } from "@/server/queries/brand.queries";
import { getUnits } from "@/server/queries/unit.queries";
import { Button } from "@/components/ui/button";

import { ProductHeader } from "./_components/product-header";
import { ProductUnitsSection } from "./_components/product-units-section";
import { ProductImagesSection } from "./_components/product-images-section";
import { ProductStockSection } from "./_components/product-stock-section";

type Props = { params: { id: string } };

export default async function ProductDetailPage({ params }: Props) {
  const [product, categories, brands, units] = await Promise.all([
    getProductById(params.id),
    getCategories(),
    getBrands(),
    getUnits(),
  ]);

  if (!product) notFound();

  const activeBrands = brands
    .filter((b) => b.isActive)
    .map((b) => ({ id: b.id, name: b.name }));
  const allUnits = units.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    symbol: u.symbol,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/productos">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver al listado
          </Link>
        </Button>
      </div>

      <ProductHeader
        product={product}
        categories={categories}
        brands={activeBrands}
        units={allUnits}
      />

      <ProductUnitsSection product={product} units={allUnits} />

      <ProductImagesSection productId={product.id} initialImages={product.images} />

      <ProductStockSection product={product} />
    </div>
  );
}
