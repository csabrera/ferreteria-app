import { getUsers } from "@/server/queries/user.queries";
import { getActiveStores } from "@/server/queries/store.queries";
import { getSession } from "@/lib/auth-guards";
import { UsersPanel } from "./_components/users-panel";

export default async function UsuariosPage() {
  const [users, stores, session] = await Promise.all([
    getUsers(),
    getActiveStores(),
    getSession(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los empleados que pueden ingresar al sistema (administradores
          y vendedores).
        </p>
      </div>

      <UsersPanel
        users={users}
        stores={stores}
        currentUserId={session?.user.id ?? ""}
      />
    </div>
  );
}
