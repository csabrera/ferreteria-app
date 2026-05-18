"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Download } from "lucide-react";
import type { MovementType } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

type Store = { id: string; code: string; name: string };

type Props = {
  productId: string;
  stores: Store[];
  initial: {
    storeId?: string;
    type?: MovementType;
    from?: string;
    to?: string;
  };
};

const TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: "ENTRY", label: "Entrada" },
  { value: "EXIT", label: "Salida" },
  { value: "ADJUSTMENT", label: "Ajuste" },
  { value: "TRANSFER_IN", label: "Transferencia entrada" },
  { value: "TRANSFER_OUT", label: "Transferencia salida" },
  { value: "SALE", label: "Venta" },
  { value: "SALE_VOID", label: "Venta anulada" },
];

export function KardexFilters({ productId, stores, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(
        `/inventario/kardex/${productId}${params.size ? "?" + params.toString() : ""}`,
      );
    },
    [router, searchParams, productId],
  );

  const hasFilters =
    !!initial.storeId || !!initial.type || !!initial.from || !!initial.to;

  const storeOptions: ComboboxOption[] = stores.map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name.toUpperCase()}`,
    keywords: s.code,
  }));

  const typeOptions: ComboboxOption[] = TYPE_OPTIONS.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  function exportCSV() {
    const params = new URLSearchParams(searchParams.toString());
    window.open(
      `/api/kardex/${productId}/export?${params.toString()}`,
      "_blank",
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
      <div className="space-y-1 min-w-[200px]">
        <Label className="text-xs">Sucursal</Label>
        <Combobox
          options={storeOptions}
          value={initial.storeId ?? null}
          onChange={(v) => update("storeId", v)}
          placeholder="Todas"
        />
      </div>

      <div className="space-y-1 min-w-[180px]">
        <Label className="text-xs">Tipo de movimiento</Label>
        <Combobox
          options={typeOptions}
          value={initial.type ?? null}
          onChange={(v) => update("type", v)}
          placeholder="Todos"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs">Desde</Label>
        <Input
          id="from"
          type="date"
          defaultValue={initial.from ?? ""}
          onChange={(e) => update("from", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">Hasta</Label>
        <Input
          id="to"
          type="date"
          defaultValue={initial.to ?? ""}
          onChange={(e) => update("to", e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/inventario/kardex/${productId}`)}
        >
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>
      )}

      <div className="ml-auto">
        <Button type="button" variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>
    </div>
  );
}
