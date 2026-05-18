import { z } from "zod";

/**
 * Producto base. Al crear se autogenera UNA presentación (`ProductUnit`)
 * con factor=1, isDefault=true y la unidad base elegida. Las presentaciones
 * adicionales (caja×24, fardo×10, etc.) se gestionan en el detalle del
 * producto (Entrega 2).
 */
export const productSchema = z.object({
  // SKU es identificador, queda UPPERCASE en BD. Si llega vacío, el server lo autogenera.
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .default(""),

  barcode: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .default(""),

  // Descriptivos: lowercase + trim; display UPPERCASE
  name: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),

  description: z
    .string()
    .trim()
    .toLowerCase()
    .max(1000, "Máximo 1000 caracteres")
    .optional()
    .default(""),

  categoryId: z.string().min(1, "Selecciona una categoría"),
  brandId: z.string().nullable(),
  baseUnitId: z.string().min(1, "Selecciona una unidad base"),

  images: z.array(z.string()).default([]),

  // costPrice NO está en el schema porque se calcula automáticamente al
  // registrar entradas de mercadería (promedio ponderado global).
  // Ver src/server/actions/inventory.actions.ts → createInventoryEntry.
  salePrice: z.coerce.number().min(0, "Precio de venta requerido"),
});

export type ProductInput = z.infer<typeof productSchema>;
