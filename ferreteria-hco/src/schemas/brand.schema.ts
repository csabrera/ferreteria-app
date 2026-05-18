import { z } from "zod";

export const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El nombre es requerido")
    .max(80, "Máximo 80 caracteres"),
  logoUrl: z.string().nullable().optional(),
});

export type BrandInput = z.infer<typeof brandSchema>;
