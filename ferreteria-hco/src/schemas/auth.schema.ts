import { z } from "zod";

export const DOCUMENT_TYPES = ["DNI", "CE", "PAS"] as const;
export type DocumentTypeT = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_LABEL: Record<DocumentTypeT, string> = {
  DNI: "DNI",
  CE: "Carné de Extranjería",
  PAS: "Pasaporte",
};

const documentValidator: Record<DocumentTypeT, RegExp> = {
  DNI: /^\d{8}$/,
  CE: /^[A-Za-z0-9]{9,12}$/,
  PAS: /^[A-Za-z0-9]{6,12}$/,
};

const documentErrorMessage: Record<DocumentTypeT, string> = {
  DNI: "El DNI debe tener exactamente 8 dígitos numéricos",
  CE: "El CE debe tener entre 9 y 12 caracteres alfanuméricos",
  PAS: "El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos",
};

export function isValidDocument(type: DocumentTypeT, number: string): boolean {
  return documentValidator[type].test(number);
}

export const loginSchema = z
  .object({
    documentType: z.enum(DOCUMENT_TYPES, {
      errorMap: () => ({ message: "Selecciona un tipo de documento válido" }),
    }),
    documentNumber: z
      .string()
      .min(1, "El número de documento es requerido")
      .max(20, "Máximo 20 caracteres"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede exceder 72 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (!isValidDocument(data.documentType, data.documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: documentErrorMessage[data.documentType],
        path: ["documentNumber"],
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
