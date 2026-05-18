import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      storeId: string | null;
      fullName: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    storeId: string | null;
    fullName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    storeId: string | null;
    fullName: string;
  }
}
