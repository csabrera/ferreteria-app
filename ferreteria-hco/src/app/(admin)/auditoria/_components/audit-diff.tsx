"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Diff sencillo entre `before` y `after` JSON. Itera por todas las llaves
 * top-level, marca filas modificadas en amarillo y los valores en rojo/verde.
 * Si `before` o `after` no son objetos, los muestra como bloque crudo.
 */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function AuditDiff({
  before,
  after,
}: {
  before: unknown;
  after: unknown;
}) {
  const [onlyChanges, setOnlyChanges] = useState(true);

  // Si ambos son objetos planos, hacer diff por llave
  if (isPlainObject(before) || isPlainObject(after)) {
    const b = isPlainObject(before) ? before : {};
    const a = isPlainObject(after) ? after : {};
    const allKeys = Array.from(
      new Set([...Object.keys(b), ...Object.keys(a)]),
    ).sort();

    const rows = allKeys.map((key) => {
      const bv = (b as Record<string, unknown>)[key];
      const av = (a as Record<string, unknown>)[key];
      const changed = !deepEqual(bv, av);
      return { key, bv, av, changed };
    });

    const visible = onlyChanges
      ? rows.filter((r) => r.changed)
      : rows;
    const changedCount = rows.filter((r) => r.changed).length;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted-foreground">
            {changedCount} de {rows.length} campo{rows.length === 1 ? "" : "s"} con cambios
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyChanges}
              onChange={(e) => setOnlyChanges(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            <span>Solo cambios</span>
          </label>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-md border bg-muted/30 py-6 text-center text-sm text-muted-foreground">
            {changedCount === 0
              ? "Sin cambios detectables a nivel de campo"
              : "Sin filas para mostrar"}
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Campo</th>
                  <th className="px-3 py-2">Antes</th>
                  <th className="px-3 py-2">Después</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((r) => (
                  <tr
                    key={r.key}
                    className={cn(
                      "align-top",
                      r.changed && "bg-amber-50",
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{r.key}</td>
                    <td
                      className={cn(
                        "px-3 py-2 font-mono text-xs",
                        r.changed && r.bv !== undefined
                          ? "text-destructive line-through decoration-destructive/40"
                          : "text-muted-foreground",
                      )}
                    >
                      <pre className="whitespace-pre-wrap break-all">
                        {formatValue(r.bv)}
                      </pre>
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 font-mono text-xs",
                        r.changed && r.av !== undefined
                          ? "font-semibold text-emerald-700"
                          : "text-muted-foreground",
                      )}
                    >
                      <pre className="whitespace-pre-wrap break-all">
                        {formatValue(r.av)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Fallback: mostrar before/after como bloques crudos
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
          Antes
        </p>
        <pre className="overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
          {formatValue(before)}
        </pre>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
          Después
        </p>
        <pre className="overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
          {formatValue(after)}
        </pre>
      </div>
    </div>
  );
}
