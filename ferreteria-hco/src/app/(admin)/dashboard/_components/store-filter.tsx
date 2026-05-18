"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Store = { id: string; code: string; name: string };

const ALL_VALUE = "__ALL__";

export function StoreFilter({
  stores,
  selectedStoreId,
}: {
  stores: Store[];
  selectedStoreId: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === ALL_VALUE) next.delete("storeId");
    else next.set("storeId", value);
    const qs = next.toString();
    router.push(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  return (
    <div className="w-64">
      <Select
        value={selectedStoreId ?? ALL_VALUE}
        onValueChange={onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Todas las sucursales" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todas las sucursales</SelectItem>
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="uppercase">
                {s.code} — {s.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
