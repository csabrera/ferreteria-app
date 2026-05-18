import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Configuración edge-safe de NextAuth.
 *
 * NO importa Prisma ni bcryptjs porque el middleware corre en Edge Runtime.
 * El provider de Credentials (que sí usa Prisma + bcrypt) se inyecta en `auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const PUBLIC = ["/login"];
      if (PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        if (isLoggedIn) {
          const dest = role === "ADMIN" ? "/dashboard" : "/pos";
          return Response.redirect(new URL(dest, request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false; // dispara redirect a signIn page
      }

      const isAdminArea =
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/") ||
        pathname.startsWith("/admin/") ||
        pathname === "/productos" ||
        pathname.startsWith("/productos/") ||
        pathname === "/inventario" ||
        pathname.startsWith("/inventario/") ||
        pathname === "/sucursales" ||
        pathname.startsWith("/sucursales/") ||
        pathname === "/usuarios" ||
        pathname.startsWith("/usuarios/") ||
        pathname === "/reportes" ||
        pathname.startsWith("/reportes/") ||
        pathname === "/configuracion" ||
        pathname.startsWith("/configuracion/") ||
        pathname === "/auditoria" ||
        pathname.startsWith("/auditoria/") ||
        pathname === "/categorias" ||
        pathname === "/marcas" ||
        pathname === "/unidades";

      if (isAdminArea && role !== "ADMIN") {
        return Response.redirect(new URL("/pos", request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.storeId = (user as { storeId: string | null }).storeId;
        token.fullName = (user as { fullName: string }).fullName;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.storeId = (token.storeId as string | null) ?? null;
        session.user.fullName = token.fullName as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
