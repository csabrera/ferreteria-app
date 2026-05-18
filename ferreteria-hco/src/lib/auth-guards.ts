import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return await auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    redirect("/pos");
  }
  return session;
}

export async function requireVendor() {
  const session = await requireSession();
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return session;
}
