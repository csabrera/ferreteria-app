"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";

import { AuditDiff } from "./audit-diff";

type LogDetail = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date | string;
  user: {
    firstName: string;
    lastNameP: string;
    lastNameM: string;
    documentNumber: string;
    role: string;
  };
};

type Props = {
  logId: string | null;
  onClose: () => void;
};

export function AuditDetailDialog({ logId, onClose }: Props) {
  const [data, setData] = useState<LogDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/auditoria/${logId}`)
      .then((r) => r.json())
      .then((d) => setData(d.log ?? null))
      .finally(() => setLoading(false));
  }, [logId]);

  return (
    <Dialog open={!!logId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle de evento auditado</DialogTitle>
          <DialogDescription>
            Comparación entre el estado anterior y posterior a la acción.
          </DialogDescription>
        </DialogHeader>

        {loading || !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 px-4 py-3 text-sm sm:grid-cols-4">
              <Field
                label="Fecha"
                value={formatDateTime(data.createdAt)}
              />
              <Field
                label="Usuario"
                value={
                  <span className="uppercase">
                    {data.user.firstName} {data.user.lastNameP}
                  </span>
                }
                subtitle={`${data.user.documentNumber} · ${data.user.role}`}
              />
              <Field
                label="Acción"
                value={
                  <Badge variant="outline" className="font-mono">
                    {data.action}
                  </Badge>
                }
              />
              <Field
                label="Entidad"
                value={data.entity}
                subtitle={data.entityId}
              />
            </div>

            <AuditDiff before={data.before} after={data.after} />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 font-medium">{value}</div>
      {subtitle && (
        <p className="font-mono text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
