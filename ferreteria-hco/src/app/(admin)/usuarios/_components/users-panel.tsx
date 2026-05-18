"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, PowerOff, Plus, KeyRound, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { UserListItem } from "@/server/queries/user.queries";
import { toggleUserActive } from "@/server/actions/user.actions";
import { composeFullName } from "@/lib/strings";

import { UserFormDialog } from "./user-form-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

type ActiveStore = { id: string; code: string; name: string };

type Props = {
  users: UserListItem[];
  stores: ActiveStore[];
  currentUserId: string;
};

export function UsersPanel({ users, stores, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        composeFullName(u).toLowerCase().includes(q) ||
        u.documentNumber.toLowerCase().includes(q),
    );
  }, [users, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(user: UserListItem) {
    setEditing(user);
    setFormOpen(true);
  }

  function handleToggle(user: UserListItem) {
    startTransition(async () => {
      const result = await toggleUserActive(user.id);
      if (result.ok) {
        toast.success(user.isActive ? "Usuario desactivado" : "Usuario activado");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o documento..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Nombre completo</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  {search
                    ? "Ningún usuario coincide con la búsqueda."
                    : "No hay usuarios registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((user, idx) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <span className="text-xs text-muted-foreground">{user.documentType}</span>{" "}
                    {user.documentNumber}
                  </td>
                  <td className="px-4 py-3 font-medium uppercase">
                    {composeFullName(user)}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {user.phone}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role === "ADMIN" ? "Administrador" : "Vendedor"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">
                    {user.store ? `${user.store.code} · ${user.store.name}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={user.isActive ? "success" : "secondary"}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                        disabled={isPending}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setResetTarget(user)}
                        disabled={isPending}
                        title="Resetear contraseña"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(user)}
                        disabled={isPending || user.id === currentUserId}
                        title={
                          user.id === currentUserId
                            ? "No puedes desactivar tu propio usuario"
                            : user.isActive
                              ? "Desactivar"
                              : "Activar"
                        }
                      >
                        {user.isActive ? (
                          <PowerOff className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Power className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        stores={stores}
      />

      <ResetPasswordDialog
        user={resetTarget}
        onClose={() => setResetTarget(null)}
      />
    </>
  );
}
