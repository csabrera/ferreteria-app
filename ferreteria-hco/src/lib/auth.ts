import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { loginSchema } from "@/schemas/auth.schema";
import { getClientIp, rateLimit } from "./rate-limit";

// Rate limit del login: 10 intentos por IP/minuto, 5 por documento/minuto.
// Brute force protection mínima. Si el atacante rota IP+documento, no lo para
// — para eso F2 puede sumar captcha tras N fallos o Redis-backed limiter.
const ipLimiter = rateLimit({ tokens: 10, window: 60_000 });
const docLimiter = rateLimit({ tokens: 5, window: 60_000 });

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        documentType: {},
        documentNumber: {},
        password: {},
      },
      async authorize(credentials, request) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { documentType, documentNumber, password } = parsed.data;

          // Rate limit por IP
          const ip = request instanceof Request ? getClientIp(request) : "unknown";
          if (!ipLimiter.check(`auth:ip:${ip}`).ok) {
            console.warn(`[auth] IP rate-limited: ${ip}`);
            return null;
          }
          // Rate limit por documento (defensa contra brute force focalizado)
          if (!docLimiter.check(`auth:doc:${documentType}:${documentNumber}`).ok) {
            console.warn(
              `[auth] document rate-limited: ${documentType} ${documentNumber}`,
            );
            return null;
          }

          const user = await prisma.user.findUnique({
            where: {
              documentType_documentNumber: { documentType, documentNumber },
            },
          });

          if (!user || !user.isActive) return null;

          const passwordOk = await bcrypt.compare(password, user.passwordHash);
          if (!passwordOk) return null;

          const fullName = `${user.firstName} ${user.lastNameP} ${user.lastNameM}`
            .trim()
            .replace(/\s+/g, " ");

          return {
            id: user.id,
            name: fullName,
            fullName,
            role: user.role,
            storeId: user.storeId,
          };
        } catch (err) {
          console.error("[auth.authorize] unexpected error:", err);
          return null;
        }
      },
    }),
  ],
});
