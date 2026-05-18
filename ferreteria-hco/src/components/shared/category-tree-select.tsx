"use client";

import { useMemo } from "react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import type { CategoryListItem } from "@/server/queries/category.queries";
import {
  buildCategoryTree,
  flattenCategoryTree,
} from "@/server/queries/category.queries";

type Props = {
  id?: string;
  value: string | null;
  onChange: (id: string | null) => void;
  categories: CategoryListItem[];
  /** ID a excluir junto con todos sus descendientes (para evitar ciclos al editar) */
  excludeId?: string;
  placeholder?: string;
  noneLabel?: string;
  /** Si false, no se puede elegir "sin selección" (no muestra clear). */
  allowNone?: boolean;
};

/**
 * Combobox jerárquico de categorías con búsqueda al escribir.
 * El label muestra el path "RAÍZ → SUBCATEGORÍA" para que la búsqueda funcione
 * por cualquier nivel y el resultado sea legible sin indentación.
 */
export function CategoryTreeSelect({
  id,
  value,
  onChange,
  categories,
  excludeId,
  placeholder = "Selecciona categoría",
  noneLabel,
  allowNone = true,
}: Props) {
  const options = useMemo<ComboboxOption[]>(() => {
    const tree = buildCategoryTree(categories);
    const flat = flattenCategoryTree(tree);

    // Excluir el id y sus descendientes
    let visible = flat;
    if (excludeId) {
      const toExclude = new Set<string>();
      function markDescendants(id: string) {
        toExclude.add(id);
        flat
          .filter((c) => c.parentId === id)
          .forEach((c) => markDescendants(c.id));
      }
      markDescendants(excludeId);
      visible = flat.filter((c) => !toExclude.has(c.id));
    }

    // Construir labels con path: "RAÍZ → SUB"
    return visible.map((cat) => {
      let label = cat.name.toUpperCase();
      let cursor: CategoryListItem | undefined = cat;
      const path: string[] = [];
      while (cursor) {
        path.unshift(cursor.name.toUpperCase());
        cursor = cursor.parentId
          ? categories.find((c) => c.id === cursor!.parentId)
          : undefined;
      }
      if (path.length > 1) {
        label = path.join(" → ");
      }
      return { value: cat.id, label, keywords: cat.slug };
    });
  }, [categories, excludeId]);

  // Para "raíz / sin padre" agregamos una opción especial via clearable
  return (
    <Combobox
      id={id}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={value ? placeholder : noneLabel ?? placeholder}
      searchPlaceholder="Buscar categoría..."
      uppercaseLabels={false}
      clearable={allowNone}
      emptyMessage="No hay categorías disponibles"
    />
  );
}
