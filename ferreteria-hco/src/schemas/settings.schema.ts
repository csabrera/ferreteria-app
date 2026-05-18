import { z } from "zod";

/**
 * IMPORTANTE: estos schemas NO usan `.transform()` para convertir strings vacíos
 * a `null`. El motivo es que el cliente (RHF) parsea con el schema y envía la
 * versión transformada al server, donde se vuelve a parsear con el MISMO schema:
 * si el output type del transform (ej. `null`) no es aceptado como input,
 * el server falla con "Invalid input".
 *
 * En su lugar:
 *   - el cliente envía strings vacíos
 *   - el server usa `emptyStringToNull()` antes de tocar la BD
 *
 * Ver `src/server/actions/settings.actions.ts`.
 */

export const identitySchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, "El nombre del negocio es requerido")
    .max(100, "Máximo 100 caracteres"),

  ruc: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\d{11}$/.test(v),
      "El RUC debe tener exactamente 11 dígitos",
    )
    .optional()
    .default(""),

  logoUrl: z.string().nullable().optional(),

  slogan: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .optional()
    .default(""),
});

export const appearanceSchema = z.object({
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex válido (ej. #2563eb)"),

  darkModeDefault: z.boolean(),

  faviconUrl: z.string().nullable().optional(),
});

export const ticketSchema = z.object({
  ticketHeader: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .default(""),

  ticketFooter: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .default(""),

  thankYouMessage: z
    .string()
    .trim()
    .min(1, "El mensaje de agradecimiento es requerido")
    .max(200, "Máximo 200 caracteres"),

  showLogoOnTicket: z.boolean(),
});

export const operationsSchema = z.object({
  currency: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(5, "Máximo 5 caracteres")
    .toUpperCase(),

  currencySymbol: z
    .string()
    .min(1, "Símbolo requerido")
    .max(3, "Máximo 3 caracteres"),

  igvPercent: z.coerce
    .number()
    .min(0, "No puede ser negativo")
    .max(100, "Máximo 100%"),

  timezone: z.string().min(1, "Zona horaria requerida"),

  defaultMinStock: z.coerce.number().min(0, "No puede ser negativo"),
});

export type IdentityInput = z.infer<typeof identitySchema>;
export type AppearanceInput = z.infer<typeof appearanceSchema>;
export type TicketInput = z.infer<typeof ticketSchema>;
export type OperationsInput = z.infer<typeof operationsSchema>;
