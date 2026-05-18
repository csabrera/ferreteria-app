import { z } from "zod";
import { DOCUMENT_TYPES, isValidDocument } from "./auth.schema";
import { isPeruMobile, PERU_MOBILE_ERROR } from "@/lib/peru";

const ROLES = ["ADMIN", "VENDOR"] as const;
export type RoleT = (typeof ROLES)[number];

const GENDERS = ["M", "F", "O"] as const;
export type GenderT = (typeof GENDERS)[number];

export const GENDER_LABEL: Record<GenderT, string> = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
};

// Documento: el número de documento se guarda en UPPERCASE (es identificador)
const documentBase = z.object({
  documentType: z.enum(DOCUMENT_TYPES, {
    errorMap: () => ({ message: "Tipo de documento inválido" }),
  }),
  documentNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Número de documento requerido")
    .max(20, "Máximo 20 caracteres"),
});

// Campos descriptivos: lowercase + trim
const namePart = (label: string) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .min(1, `${label} requerido`)
    .max(60, `${label}: máximo 60 caracteres`)
    .regex(
      /^[a-záéíóúüñ\s'-]+$/i,
      `${label}: solo letras, espacios, guiones y apóstrofes`,
    );

const personalFields = {
  lastNameP: namePart("Apellido paterno"),
  lastNameM: namePart("Apellido materno"),
  firstName: namePart("Nombres"),

  phone: z.string().trim().refine(isPeruMobile, PERU_MOBILE_ERROR),

  // Email opcional: si viene "" lo transformamos a null en el action
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido")
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal("")),

  // Fecha de nacimiento — input HTML5 date envía string "YYYY-MM-DD"
  birthDate: z.coerce
    .date({ errorMap: () => ({ message: "Fecha inválida" }) })
    .refine((d) => d <= new Date(), "La fecha no puede ser futura")
    .refine(
      (d) => d >= new Date("1900-01-01"),
      "La fecha debe ser posterior a 1900",
    ),

  address: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Dirección requerida")
    .max(200, "Máximo 200 caracteres"),

  gender: z.enum(GENDERS, {
    errorMap: () => ({ message: "Sexo inválido" }),
  }),
};

function refineRoleAndStore<T extends { role: RoleT; storeId: string | null }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.role === "VENDOR" && !data.storeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Un vendedor debe tener una sucursal asignada",
      path: ["storeId"],
    });
  }
}

function refineDocumentFormat<T extends { documentType: typeof DOCUMENT_TYPES[number]; documentNumber: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (!isValidDocument(data.documentType, data.documentNumber)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Número de documento inválido para el tipo seleccionado",
      path: ["documentNumber"],
    });
  }
}

// CREATE — sin password (se autogenera = documentNumber)
export const createUserSchema = documentBase
  .extend({
    ...personalFields,
    role: z.enum(ROLES, { errorMap: () => ({ message: "Rol inválido" }) }),
    storeId: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    refineDocumentFormat(data, ctx);
    refineRoleAndStore(data, ctx);
  });

// UPDATE — incluye id
export const updateUserSchema = documentBase
  .extend({
    ...personalFields,
    id: z.string().min(1),
    role: z.enum(ROLES),
    storeId: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    refineDocumentFormat(data, ctx);
    refineRoleAndStore(data, ctx);
  });

export const resetPasswordSchema = z.object({
  id: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export { ROLES, GENDERS };
