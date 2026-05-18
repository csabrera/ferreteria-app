"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CategoryListItem,
  CategoryNode,
} from "@/server/queries/category.queries";
import { buildCategoryTree } from "@/server/queries/category.queries";
import { toggleCategoryActive } from "@/server/actions/category.actions";

import { CategoryFormDialog } from "./category-form-dialog";
import { CategoryTreeNode } from "./category-tree-node";

/**
 * Calcula recursivamente el conteo de productos incluyendo todos los descendientes.
 * Construye un Map<id, totalProducts> en una sola pasada.
 */
function buildProductCountsMap(nodes: CategoryNode[]): Map<string, number> {
  const map = new Map<string, number>();

  function visit(node: CategoryNode): number {
    const childrenTotal = node.children.reduce((sum, c) => sum + visit(c), 0);
    const total = node._count.products + childrenTotal;
    map.set(node.id, total);
    return total;
  }

  nodes.forEach(visit);
  return map;
}

/**
 * Filtra el árbol por término de búsqueda: muestra una rama si alguna
 * categoría del subárbol coincide con el texto.
 */
function filterTree(nodes: CategoryNode[], query: string): CategoryNode[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  function matches(node: CategoryNode): CategoryNode | null {
    const childMatches = node.children
      .map(matches)
      .filter((c): c is CategoryNode => c !== null);
    const selfMatch = node.name.includes(q);
    if (selfMatch || childMatches.length > 0) {
      return { ...node, children: childMatches };
    }
    return null;
  }
  return nodes.map(matches).filter((n): n is CategoryNode => n !== null);
}

export function CategoriesPanel({
  categories,
}: {
  categories: CategoryListItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryListItem | null>(null);
  const [parentForNew, setParentForNew] = useState<CategoryListItem | null>(null);

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const productCounts = useMemo(() => buildProductCountsMap(tree), [tree]);
  const filteredTree = useMemo(() => filterTree(tree, search.trim()), [tree, search]);

  const rootCount = tree.length;
  const totalCount = categories.length;

  function openCreateRoot() {
    setParentForNew(null);
    setEditing(null);
    setDialogOpen(true);
  }

  function openCreateChild(parent: CategoryNode) {
    setParentForNew(parent);
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(cat: CategoryNode) {
    setParentForNew(null);
    setEditing(cat);
    setDialogOpen(true);
  }

  function handleToggle(cat: CategoryNode) {
    startTransition(async () => {
      const result = await toggleCategoryActive(cat.id);
      if (result.ok) {
        toast.success(cat.isActive ? "Categoría desactivada" : "Categoría activada");
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
            placeholder="Buscar categoría..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Button onClick={openCreateRoot}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva categoría
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-2">
        {filteredTree.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {search
              ? "Ninguna categoría coincide con la búsqueda."
              : "No hay categorías. Crea la primera con \"Nueva categoría\"."}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredTree.map((node) => (
              <CategoryTreeNode
                key={node.id}
                node={node}
                totalProducts={productCounts.get(node.id) ?? 0}
                productCounts={productCounts}
                onEdit={openEdit}
                onAddChild={openCreateChild}
                onToggle={handleToggle}
                defaultExpanded={!!search}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-right text-xs text-muted-foreground">
        {rootCount} categoría{rootCount === 1 ? "" : "s"} raíz · {totalCount} en total
      </div>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        defaultParent={parentForNew}
        categories={categories}
      />
    </>
  );
}
