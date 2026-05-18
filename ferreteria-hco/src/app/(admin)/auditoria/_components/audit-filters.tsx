"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIT_ENTITIES } from "@/server/queries/audit.queries";

type UserOption = {
  id: string;
  firstName: string;
  lastNameP: string;
  documentNumber: string;
};

const ALL_VALUE = "__ALL__";

export function AuditFilters({
  users,
  initialFilters,
}: {
  users: UserOption[];
  initialFilters: {
    userId: string | null;
    action: string | null;
    entity: string | null;
    from: string | null;
    to: string | null;
  };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "" || value === ALL_VALUE) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Cualquier cambio de filtro resetea la página a 1
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `/auditoria?${qs}` : "/auditoria");
    });
  }

  function clear() {
    startTransition(() => {
      router.push("/auditoria");
    });
  }

  const hasFilters =
    !!initialFilters.userId ||
    !!initialFilters.action ||
    !!initialFilters.entity ||
    !!initialFilters.from ||
    !!initialFilters.to;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs">Usuario</Label>
          <Select
            value={initialFilters.userId ?? ALL_VALUE}
            onValueChange={(v) => updateParam("userId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <span className="uppercase">
                    {u.firstName} {u.lastNameP}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                    {u.documentNumber}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Entidad</Label>
          <Select
            value={initialFilters.entity ?? ALL_VALUE}
            onValueChange={(v) => updateParam("entity", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todas</SelectItem>
              {AUDIT_ENTITIES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="action">
            Acción (contiene)
          </Label>
          <Input
            id="action"
            placeholder="Ej: SALE, UPDATE..."
            defaultValue={initialFilters.action ?? ""}
            onBlur={(e) => updateParam("action", e.currentTarget.value.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("action", (e.target as HTMLInputElement).value.trim());
              }
            }}
            className="font-mono uppercase"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="from">
            Desde
          </Label>
          <Input
            id="from"
            type="date"
            value={initialFilters.from ?? ""}
            onChange={(e) => updateParam("from", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs" htmlFor="to">
            Hasta
          </Label>
          <Input
            id="to"
            type="date"
            value={initialFilters.to ?? ""}
            onChange={(e) => updateParam("to", e.target.value)}
          />
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={isPending}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
