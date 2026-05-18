import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { formatQuantity } from "@/lib/format";

type ProductDetail = {
  id: string;
  sku: string;
  name: string;
  images: string[];
  baseUnit: { code: string; symbol: string };
  stocks: Array<{
    quantity: number;
    minStock: number;
    store: { id: string; code: string; name: string };
  }>;
};

export function KardexHeader({ product }: { product: ProductDetail }) {
  const total = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="flex items-start gap-4 rounded-lg border bg-card p-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border bg-muted">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="64px"
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="font-mono text-xs text-muted-foreground">{product.sku}</div>
        <Link
          href={`/productos/${product.id}`}
          className="text-xl font-bold uppercase hover:text-primary hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {product.stocks.map((s) => (
            <div key={s.store.id} className="text-muted-foreground">
              <span className="font-mono font-medium">{s.store.code}</span>:{" "}
              <span className="font-mono text-foreground">
                {formatQuantity(s.quantity)} {product.baseUnit.symbol}
              </span>
            </div>
          ))}
          {product.stocks.length > 0 && (
            <div className="text-muted-foreground">
              <span className="text-xs uppercase">Total:</span>{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatQuantity(total)} {product.baseUnit.symbol}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
