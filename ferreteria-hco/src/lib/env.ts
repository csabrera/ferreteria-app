import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET debe tener al menos 16 caracteres"),
  AUTH_URL: z.string().url(),
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
