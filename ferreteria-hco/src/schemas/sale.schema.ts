import { z } from "zod";

export const createSaleItemSchema = z.object({
  productUnitId: z.string().min(1, "Presentación inválida"),
  quantity: z.coerce
    .number()
    .positive("La cantidad debe ser mayor a 0")
    .max(1_000_000, "Cantidad demasiado grande"),
});

export const createSalePaymentSchema = z.object({
  paymentMethodId: z.string().min(1, "Selecciona un método de pago"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  reference: z
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .default(""),
});

export const createSaleSchema = z.object({
  items: z.array(createSaleItemSchema).min(1, "Agrega al menos un producto"),
  discount: z.coerce
    .number()
    .min(0, "El descuento no puede ser negativo")
    .max(1_000_000, "Descuento demasiado grande")
    .default(0),
  payment: createSalePaymentSchema,
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .default(""),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreateSaleItemInput = z.infer<typeof createSaleItemSchema>;

// Detalle del error tipado de stock insuficiente
export type InsufficientStockLine = {
  productId: string;
  productUnitId: string;
  productName: string;
  unitSymbol: string;
  requested: number; // en unidad base
  available: number; // en unidad base
};
