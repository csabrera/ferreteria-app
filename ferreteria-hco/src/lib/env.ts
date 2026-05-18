import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET debe tener al menos 16 caracteres"),
  // AUTH_URL es OPCIONAL en NextAuth v5 con `trustHost: true` — la library
  // auto-detecta la URL desde los headers (Railway/Vercel/etc). Si la setean
  // debe ser una URL válida con protocolo; si la dejan vacía o sin definir,
  // el library la infiere en runtime.
  AUTH_URL: z
    .string()
    .url("AUTH_URL debe incluir protocolo, ej. https://app.railway.app")
    .optional()
    .or(z.literal("")),
  STORAGE_PROVIDER: z.enum(["local", "cloudinary", "r2", "uploadthing"]).default("local"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Variables de entorno inválidas:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Configuración de entorno inválida. Revisa .env.local");
  }
  return parsed.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
