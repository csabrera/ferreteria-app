"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { AuditLogItem } from "@/server/queries/audit.queries";

import { AuditDetailDialog } from "./audit-detail-dialog";

type Props = {
  logs: AuditLogItem[];
  startIndex?: number;
};

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "outline";

function actionVariant(action: string): BadgeVariant {
  if (action.includes("DELETE") || action.includes("DEACTIVATE")) return "destructive";
  if (action.includes("CREATE") || action.includes("ACTIVATE")) return "success";
  if (action.includes("DIFFERENCE") || action.includes("VOID")) return "warning";
  if (action.includes("UPDATE")) return "secondary";
  return "outline";
}

export function AuditTable({ logs, startIndex = 0 }: Props) {
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 w-12 text-center">#</th>
              <th className="px-3 py-3">Fecha</th>
              <th className="px-3 py-3">Usuario</th>
              <th className="px-3 py-3">Acción</th>
              <th className="px-3 py-3">Entidad</th>
              <th className="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-12 text-center text-muted-foreground"
                >
                  Sin eventos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              logs.map((l, idx) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2 text-center font-mono text-xs text-muted-foreground">
                    {startIndex + idx + 1}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDateTime(l.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="uppercase">
                      {l.user.firstName} {l.user.lastNameP}
                    </span>
                    <p className="text-xs text-muted-foreground font-mono">
                      {l.user.documentNumber} · {l.user.role}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant={actionVariant(l.action)}
                      className="font-mono text-[10px]"
                    >
                      {l.action}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{l.entity}</span>
                    <p className="text-xs font-mono text-muted-foreground truncate max-w-[20ch]">
                      {l.entityId}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailId(l.id)}
                      title="Ver detalle"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AuditDetailDialog
        logId={detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
