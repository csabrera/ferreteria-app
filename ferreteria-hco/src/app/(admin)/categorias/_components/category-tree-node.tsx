"use client";

import { useState } from "react";
import { ChevronRight, Folder, FolderOpen, MoreVertical, Pencil, Plus, Power, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/server/queries/category.queries";

type Props = {
  node: CategoryNode;
  /** Conteo de productos incluyendo descendientes */
  totalProducts: number;
  /** Mapa de id → totalProducts (recursivo) para todos los nodos */
  productCounts: Map<string, number>;
  onEdit: (node: CategoryNode) => void;
  onAddChild: (node: CategoryNode) => void;
  onToggle: (node: CategoryNode) => void;
  /** Si está expandido inicialmente. Solo aplica a la primera carga */
  defaultExpanded?: boolean;
};

export function CategoryTreeNode({
  node,
  totalProducts,
  productCounts,
  onEdit,
  onAddChild,
  onToggle,
  defaultExpanded = false,
}: Props) {
  const [open, setOpen] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50",
          !node.isActive && "opacity-50",
        )}
        style={{ paddingLeft: `${node.depth * 24 + 8}px` }}
      >
        {/* Flecha expandir/colapsar */}
        <button
          type="button"
          onClick={() => hasChildren && setOpen((o) => !o)}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
            hasChildren && "hover:bg-muted",
            !hasChildren && "invisible",
          )}
          aria-label={open ? "Colapsar" : "Expandir"}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
        </button>

        {/* Ícono carpeta */}
        {open && hasChildren ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        {/* Nombre */}
        <span className="flex-1 truncate text-sm font-medium uppercase">
          {node.name}
        </span>

        {/* Badge de inactivo */}
        {!node.isActive && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            Inactiva
          </Badge>
        )}

        {/* Contador */}
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {totalProducts === 0
            ? "sin productos"
            : `${totalProducts} ${totalProducts === 1 ? "producto" : "productos"}`}
          {hasChildren && (
            <span className="ml-2 opacity-60">
              · {node.children.length} subcat.
            </span>
          )}
        </span>

        {/* Menú ⋮ */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label="Acciones"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onEdit(node)}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddChild(node)}>
              <Plus />
              Agregar subcategoría
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onToggle(node)}
              className={
                node.isActive
                  ? "text-destructive focus:text-destructive"
                  : "text-emerald-600 focus:text-emerald-600"
              }
            >
              {node.isActive ? (
                <>
                  <PowerOff />
                  Desactivar
                </>
              ) : (
                <>
                  <Power />
                  Activar
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hijos */}
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              totalProducts={productCounts.get(child.id) ?? 0}
              productCounts={productCounts}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
