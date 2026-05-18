import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { getProductById } from "@/server/queries/product.queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await requireAdmin();

  const product = await getProductById(params.id);
  if (!product) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    brandId: product.brandId,
    baseUnitId: product.baseUnitId,
    images: product.images,
    salePrice: product.salePrice,
  });
}
