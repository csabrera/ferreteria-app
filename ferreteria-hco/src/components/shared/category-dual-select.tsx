"use client";

import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import type { CategoryListItem } from "@/server/queries/category.queries";

type Mode = "form" | "filter";

type Props = {
  /** ID de la categoría seleccionada (puede ser una raíz si no tiene subs, o una sub) */
  value: string | null;
  onChange: (categoryId: string | null) => void;
  categories: CategoryListItem[];
  /** `form` exige subcategoría si la raíz tiene subs. `filter` la deja opcional. */
  mode?: Mode;
  idPrefix?: string;
};

export function CategoryDualSelect({
  value,
  onChange,
  categories,
  mode = "form",
  idPrefix = "category",
}: Props) {
  // Mapas raíz → hijos
  const roots = useMemo(
    () => categories.filter((c) => c.parentId === null && c.isActive),
    [categories],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, CategoryListItem[]>();
    for (const c of categories) {
      if (c.parentId && c.isActive) {
        const arr = map.get(c.parentId) ?? [];
        arr.push(c);
        map.set(c.parentId, arr);
      }
    }
    return map;
  }, [categories]);

  // Resolver la raíz inicial a partir del value (que puede ser raíz o sub)
  const resolveRoot = (catId: string | null): string | null => {
    if (!catId) return null;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return null;
    return cat.parentId ?? cat.id;
  };

  const [rootId, setRootId] = useState<string | null>(() => resolveRoot(value));

  // Si el value externo cambia (ej. reset del form), re-derivar raíz
  useEffect(() => {
    setRootId(resolveRoot(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const rootOptions: ComboboxOption[] = useMemo(
    () => roots.map((r) => ({ value: r.id, label: r.name.toUpperCase() })),
    [roots],
  );

  const subOptions: ComboboxOption[] = useMemo(() => {
    if (!rootId) return [];
    return (childrenByParent.get(rootId) ?? []).map((c) => ({
      value: c.id,
      label: c.name.toUpperCase(),
    }));
  }, [rootId, childrenByParent]);

  const hasSubs = subOptions.length > 0;
  // El value es una sub solo si pertenece a la rama del rootId actual
  const subValue =
    value && rootId && categories.find((c) => c.id === value)?.parentId === rootId
      ? value
      : null;

  function handleRootChange(newRoot: string | null) {
    setRootId(newRoot);
    if (newRoot === null) {
      onChange(null);
      return;
    }
    const subs = childrenByParent.get(newRoot) ?? [];
    if (subs.length === 0) {
      // Raíz sin subs: en mode=form, NO emitir hasta tener sub.
      // En mode=filter, emitir la raíz directamente.
      onChange(mode === "filter" ? newRoot : null);
    } else {
      // Tiene subs: limpiar selección de sub anterior
      onChange(null);
    }
  }

  function handleSubChange(newSub: string | null) {
    onChange(newSub);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Combobox
          id={`${idPrefix}-root`}
          options={rootOptions}
          value={rootId}
          onChange={handleRootChange}
          placeholder="Categoría"
          searchPlaceholder="Buscar categoría..."
          uppercaseLabels
          clearable
        />
      </div>

      <div className="space-y-1">
        {hasSubs ? (
          <Combobox
            id={`${idPrefix}-sub`}
            options={subOptions}
            value={subValue}
            onChange={handleSubChange}
            placeholder="Subcategoría"
            searchPlaceholder="Buscar subcategoría..."
            uppercaseLabels
            clearable={mode === "filter"}
            disabled={!rootId}
          />
        ) : (
          <Combobox
            options={[]}
            value={null}
            onChange={() => {}}
            placeholder={rootId ? "Sin subcategorías" : "Subcategoría"}
            disabled
          />
        )}
        {mode === "form" && rootId && !hasSubs && (
          <p
            className={cn(
              "flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400",
            )}
          >
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Esta categoría no tiene subcategorías.{" "}
              <Link
                href="/categorias"
                className="underline underline-offset-2 hover:text-amber-700"
                target="_blank"
              >
                Crea una primero
              </Link>{" "}
              para asignar productos.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
