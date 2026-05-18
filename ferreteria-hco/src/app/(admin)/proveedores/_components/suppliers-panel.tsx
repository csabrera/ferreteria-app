"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Power, PowerOff, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { SupplierListItem } from "@/server/queries/supplier.queries";
import { toggleSupplierActive } from "@/server/actions/supplier.actions";

import { SupplierFormDialog } from "./supplier-form-dialog";

export function SuppliersPanel({ suppliers }: { suppliers: SupplierListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierListItem | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.trim().toLowerCase();
    return suppliers.filter(
      (s) =>
        s.businessName.toLowerCase().includes(q) ||
        s.ruc.includes(q) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)),
    );
  }, [suppliers, search]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(supplier: SupplierListItem) {
    setEditing(supplier);
    setDialogOpen(true);
  }

  function handleToggle(supplier: SupplierListItem) {
    startTransition(async () => {
      const result = await toggleSupplierActive(supplier.id);
      if (result.ok) {
        toast.success(
          supplier.isActive ? "Proveedor desactivado" : "Proveedor activado",
        );
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
            placeholder="Buscar por RUC, razón social o contacto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proveedor
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">RUC</th>
              <th className="px-4 py-3">Razón social</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Celular</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Entradas</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  {search
                    ? "Ningún proveedor coincide con la búsqueda."
                    : "No hay proveedores registrados."}
                </td>
              </tr>
            ) : (
              filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono">{s.ruc}</td>
                  <td className="px-4 py-3 uppercase font-medium">{s.businessName}</td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">
                    {s.contactName ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {s.phone}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s._count.inventoryMovements}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={s.isActive ? "success" : "secondary"}>
                      {s.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                        disabled={isPending}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(s)}
                        disabled={isPending}
                        title={s.isActive ? "Desactivar" : "Activar"}
                      >
                        {s.isActive ? (
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

      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editing}
      />
    </>
  );
}
