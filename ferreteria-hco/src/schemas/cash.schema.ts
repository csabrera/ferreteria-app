import { z } from "zod";

export const openCashSessionSchema = z.object({
  cashRegisterId: z.string().min(1, "Selecciona la caja"),
  openingAmount: z.coerce
    .number()
    .min(0, "El monto no puede ser negativo")
    .max(1_000_000, "Monto demasiado grande"),
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .default(""),
});

export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>;

// Tipos disponibles al vendedor para movimientos manuales.
// SALE proviene solo del POS (Paso 11) — no del UI manual.
export const manualMovementTypeSchema = z.enum([
  "INCOME",
  "EXPENSE",
  "WITHDRAWAL",
  "DEPOSIT",
]);
export type ManualMovementType = z.infer<typeof manualMovementTypeSchema>;

export const addCashMovementSchema = z.object({
  type: manualMovementTypeSchema,
  amount: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(1_000_000, "Monto demasiado grande"),
  description: z
    .string()
    .trim()
    .min(1, "Describe el motivo del movimiento")
    .max(200, "Máximo 200 caracteres"),
});

export type AddCashMovementInput = z.infer<typeof addCashMovementSchema>;

export const closeCashSessionSchema = z.object({
  countedAmount: z.coerce
    .number()
    .min(0, "El monto no puede ser negativo")
    .max(1_000_000, "Monto demasiado grande"),
  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .default(""),
});

export type CloseCashSessionInput = z.infer<typeof closeCashSessionSchema>;

// Etiquetas en español para los tipos de movimiento
export const MOVEMENT_TYPE_LABEL: Record<string, string> = {
  SALE: "Venta",
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  WITHDRAWAL: "Retiro",
  DEPOSIT: "Depósito",
};
