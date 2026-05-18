"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MultiImageUploader } from "@/components/shared/multi-image-uploader";
import { updateProductImages } from "@/server/actions/product-images.actions";

type Props = {
  productId: string;
  initialImages: string[];
};

export function ProductImagesSection({ productId, initialImages }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(initialImages);
  const dirty =
    images.length !== initialImages.length ||
    images.some((url, i) => url !== initialImages[i]);

  function handleSave() {
    startTransition(async () => {
      const result = await updateProductImages(productId, images);
      if (result.ok) {
        toast.success("Imágenes guardadas");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Imágenes</CardTitle>
          <CardDescription>
            La primera imagen (con borde azul) es la principal y se muestra en
            la lista de productos y en el POS.
          </CardDescription>
        </div>
        {dirty && (
          <Button onClick={handleSave} size="sm" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Guardar cambios
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <MultiImageUploader value={images} onChange={setImages} folder="products" />
      </CardContent>
    </Card>
  );
}
