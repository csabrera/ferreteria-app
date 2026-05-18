import { z } from "zod";
import { isPeruMobile, PERU_MOBILE_ERROR, isPeruRuc, PERU_RUC_ERROR } from "@/lib/peru";

export const supplierSchema = z.object({
  ruc: z.string().trim().refine(isPeruRuc, PERU_RUC_ERROR),

  // Descriptivos: lowercase + trim; UPPERCASE display
  businessName: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Razón social requerida")
    .max(200, "Máximo 200 caracteres"),

  contactName: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Máximo 120 caracteres")
    .optional()
    .default(""),

  phone: z.string().trim().refine(isPeruMobile, PERU_MOBILE_ERROR),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(120)
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Dirección requerida")
    .max(200, "Máximo 200 caracteres"),

  notes: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .default(""),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
