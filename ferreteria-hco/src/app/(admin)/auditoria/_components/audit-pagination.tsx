"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function AuditPagination({ page, pageSize, total, totalPages }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function goTo(p: number) {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    router.push(qs ? `/auditoria?${qs}` : "/auditoria");
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
      <p className="text-muted-foreground">
        Mostrando <strong>{from}</strong>–<strong>{to}</strong> de{" "}
        <strong>{total}</strong> evento{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(1)}
          disabled={!canPrev}
          title="Primera página"
          className="h-7 w-7 p-0"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page - 1)}
          disabled={!canPrev}
          title="Anterior"
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 font-mono text-xs">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page + 1)}
          disabled={!canNext}
          title="Siguiente"
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(totalPages)}
          disabled={!canNext}
          title="Última página"
          className="h-7 w-7 p-0"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
