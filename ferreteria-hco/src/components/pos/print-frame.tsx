"use client";

import { useEffect, useRef } from "react";

/**
 * Iframe oculto que carga `/api/ticket/{id}?print=1`. La query `print=1` hace
 * que el HTML del ticket dispare window.print() automáticamente al cargar.
 *
 * Cambiar `saleId` dispara la impresión. Para reimprimir la misma venta,
 * mejor incrementar `nonce` aunque saleId sea el mismo.
 */
export function PrintFrame({
  saleId,
  nonce = 0,
}: {
  saleId: string | null;
  nonce?: number;
}) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!saleId) return;
    if (ref.current) {
      ref.current.src = `/api/ticket/${saleId}?print=1&n=${nonce}`;
    }
  }, [saleId, nonce]);

  if (!saleId) return null;

  return (
    <iframe
      ref={ref}
      title="ticket"
      className="fixed -left-[9999px] -top-[9999px] h-px w-px opacity-0"
      aria-hidden="true"
    />
  );
}
