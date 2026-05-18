import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getCategories = cache(async () => {
  return prisma.category.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      imageUrl: true,
      isActive: true,
      _count: { select: { products: true, children: true } },
    },
  });
});

export type CategoryListItem = Awaited<ReturnType<typeof getCategories>>[number];

export type CategoryNode = CategoryListItem & {
  children: CategoryNode[];
  depth: number;
};

/**
 * Construye el árbol jerárquico a partir de la lista plana.
 * Asume que `getCategories` ya viene ordenado por name.
 */
export function buildCategoryTree(flat: CategoryListItem[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  flat.forEach((c) => byId.set(c.id, { ...c, children: [], depth: 0 }));

  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Segunda pasada: asignar depth correctamente desde las raíces
  function assignDepth(node: CategoryNode, depth: number) {
    node.depth = depth;
    node.children.forEach((c) => assignDepth(c, depth + 1));
  }
  roots.forEach((r) => assignDepth(r, 0));

  return roots;
}

/**
 * Aplana el árbol en una lista DFS preservando el orden visual.
 * Útil para renderizar como tabla con indentación.
 */
export function flattenCategoryTree(roots: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  function visit(node: CategoryNode) {
    result.push(node);
    node.children.forEach(visit);
  }
  roots.forEach(visit);
  return result;
}
