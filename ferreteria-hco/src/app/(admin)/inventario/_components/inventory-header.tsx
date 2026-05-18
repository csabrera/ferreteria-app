"use client";

import { useState } from "react";
import { PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { EntryFormDialog } from "./entry-form-dialog";

type Store = { id: string; code: string; name: string };
type Supplier = { id: string; ruc: string; businessName: string };

type Props = {
  stores: Store[];
  suppliers: Supplier[];
};

export function InventoryHeader({ stores, suppliers }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Stock por sucursal. Cualquier movimiento queda registrado en el kardex
            del producto.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={suppliers.length === 0}>
          <PackagePlus className="mr-2 h-4 w-4" />
          Nueva entrada
        </Button>
      </div>

      {suppliers.length === 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          ⚠️ No hay proveedores activos. Para registrar entradas debes crear al
          menos uno en <strong>Proveedores</strong>.
        </div>
      )}

      <EntryFormDialog
        open={open}
        onOpenChange={setOpen}
        stores={stores}
        suppliers={suppliers}
      />
    </>
  );
}
