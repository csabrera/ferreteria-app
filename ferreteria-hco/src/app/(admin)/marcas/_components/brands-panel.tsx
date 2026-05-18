"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BrandListItem } from "@/server/queries/brand.queries";
import { toggleBrandActive } from "@/server/actions/brand.actions";

import { BrandFormDialog } from "./brand-form-dialog";

export function BrandsPanel({ brands }: { brands: BrandListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandListItem | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(brand: BrandListItem) {
    setEditing(brand);
    setDialogOpen(true);
  }

  function handleToggle(brand: BrandListItem) {
    startTransition(async () => {
      const result = await toggleBrandActive(brand.id);
      if (result.ok) {
        toast.success(brand.isActive ? "Marca desactivada" : "Marca activada");
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
          Nueva marca
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-center">Productos</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {brands.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No hay marcas registradas.
                </td>
              </tr>
            ) : (
              brands.map((brand, idx) => (
                <tr key={brand.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    {brand.logoUrl ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded border bg-muted">
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          fill
                          sizes="32px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium uppercase">{brand.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {brand.slug}
                  </td>
                  <td className="px-4 py-3 text-center">{brand._count.products}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={brand.isActive ? "success" : "secondary"}>
                      {brand.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(brand)}
                        disabled={isPending}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(brand)}
                        disabled={isPending}
                        title={brand.isActive ? "Desactivar" : "Activar"}
                      >
                        {brand.isActive ? (
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

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={editing}
      />
    </>
  );
}
