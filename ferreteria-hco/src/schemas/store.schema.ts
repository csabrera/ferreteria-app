import { z } from "zod";
import { isPeruMobile, PERU_MOBILE_ERROR } from "@/lib/peru";

export const storeSchema = z.object({
  // `code` es identificador único, se mantiene UPPERCASE también en BD
  code: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones")
    .toUpperCase(),

  // Descriptivos: lowercase + trim en BD; UPPERCASE en display
  name: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Nombre requerido")
    .max(100, "Máximo 100 caracteres"),

  address: z
    .string()
    .trim()
    .toLowerCase()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .default(""),

  // Celular Perú obligatorio
  phone: z
    .string()
    .trim()
    .refine(isPeruMobile, PERU_MOBILE_ERROR),
});

export type StoreInput = z.infer<typeof storeSchema>;
