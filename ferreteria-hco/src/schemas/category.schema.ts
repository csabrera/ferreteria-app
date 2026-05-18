import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El nombre es requerido")
    .max(80, "Máximo 80 caracteres"),
  parentId: z.string().nullable(),
  imageUrl: z.string().nullable().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
