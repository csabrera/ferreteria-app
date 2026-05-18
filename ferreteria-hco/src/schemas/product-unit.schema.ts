import { z } from "zod";

/**
 * Presentación de un producto (caja×24, fardo×10, etc).
 * Reglas:
 *   - Exactamente UNA presentación por producto tiene `isDefault: true`.
 *   - `factor` indica cuántas unidades base equivalen a esta presentación.
 *     La presentación base tiene factor=1.
 *   - `(productId, unitId)` es único: no puedes tener 2 presentaciones de
 *     la misma unidad para el mismo producto.
 */
export const productUnitSchema = z.object({
  unitId: z.string().min(1, "Unidad requerida"),
  factor: z.coerce
    .number()
    .positive("El factor debe ser mayor a 0")
    .max(1_000_000, "Factor demasiado grande"),
  salePrice: z.coerce.number().min(0, "Precio no puede ser negativo"),
  barcode: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .default(""),
  isDefault: z.boolean().default(false),
});

export type ProductUnitInput = z.infer<typeof productUnitSchema>;
