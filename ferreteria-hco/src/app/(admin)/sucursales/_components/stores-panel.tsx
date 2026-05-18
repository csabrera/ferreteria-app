"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, PowerOff, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StoreWithCounts } from "@/server/queries/store.queries";
import { toggleStoreActive } from "@/server/actions/store.actions";

import { StoreFormDialog } from "./store-form-dialog";

export function StoresPanel({ stores }: { stores: StoreWithCounts[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StoreWithCounts | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(store: StoreWithCounts) {
    setEditing(store);
    setDialogOpen(true);
  }

  function handleToggle(store: StoreWithCounts) {
    startTransition(async () => {
      const result = await toggleStoreActive(store.id);
      if (result.ok) {
        toast.success(
          store.isActive ? "Sucursal desactivada" : "Sucursal activada",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva sucursal
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3 text-center">Usuarios</th>
              <th className="px-4 py-3 text-center">Cajas</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stores.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  No hay sucursales registradas.
                </td>
              </tr>
            ) : (
              stores.map((store, idx) => (
                <tr key={store.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium">{store.code}</td>
                  <td className="px-4 py-3 uppercase">{store.name}</td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">
                    {store.address ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {store.phone}
                  </td>
                  <td className="px-4 py-3 text-center">{store._count.users}</td>
                  <td className="px-4 py-3 text-center">
                    {store._count.cashRegisters}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={store.isActive ? "success" : "secondary"}>
                      {store.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(store)}
                        disabled={isPending}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(store)}
                        disabled={isPending}
                        title={store.isActive ? "Desactivar" : "Activar"}
                      >
                        {store.isActive ? (
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

      <StoreFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        store={editing}
      />
    </>
  );
}
