import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Necesita sesión (cookies) → dinámica por definición
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  redirect("/pos");
}
