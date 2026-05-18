import { z } from "zod";

const entryLineSchema = z.object({
  productId: z.string().min(1, "Producto requerido"),
  quantity: z.coerce
    .number()
    .positive("La cantidad debe ser mayor a 0")
    .max(1_000_000, "Cantidad demasiado grande"),
  unitCost: z.coerce
    .number()
    .min(0, "El costo no puede ser negativo")
    .max(1_000_000, "Costo demasiado grande"),
  // Precio de venta nuevo. Si difiere del precio actual del producto,
  // se actualiza Product.salePrice. Si es igual o vacío, no se toca.
  newSalePrice: z.coerce
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(1_000_000, "Precio demasiado grande"),
});

export const inventoryEntrySchema = z
  .object({
    storeId: z.string().min(1, "Selecciona la sucursal de destino"),
    supplierId: z.string().min(1, "Selecciona el proveedor"),
    reference: z
      .string()
      .trim()
      .toLowerCase()
      .max(100, "Máximo 100 caracteres")
      .optional()
      .default(""),
    notes: z
      .string()
      .trim()
      .toLowerCase()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .default(""),
    items: z.array(entryLineSchema).min(1, "Agrega al menos un producto"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.items.forEach((item, idx) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este producto ya está en otra línea de la entrada",
          path: ["items", idx, "productId"],
        });
      }
      seen.add(item.productId);
    });
  });

export type InventoryEntryInput = z.infer<typeof inventoryEntrySchema>;
export type InventoryEntryLine = z.infer<typeof entryLineSchema>;
