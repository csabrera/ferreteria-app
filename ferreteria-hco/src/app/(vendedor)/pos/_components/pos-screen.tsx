"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PosSearch } from "@/components/pos/pos-search";
import type { Presentation, SearchResult } from "@/components/pos/pos-search";
import { PresentationPicker } from "@/components/pos/presentation-picker";
import { PosCart } from "@/components/pos/pos-cart";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { InsufficientStockDialog } from "@/components/pos/insufficient-stock-dialog";
import { PrintFrame } from "@/components/pos/print-frame";
import { useCart, computeTotals } from "@/stores/cart.store";
import { formatCurrency } from "@/lib/format";
import { createSale } from "@/server/actions/sale.actions";
import type { PaymentMethodOption } from "@/server/queries/payment-method.queries";
import type { InsufficientStockLine } from "@/schemas/sale.schema";

type Props = {
  sessionInfo: {
    cashRegisterName: string;
    storeId: string;
    storeCode: string;
    storeName: string;
    vendorName: string;
    openingAmount: number;
    expectedAmount: number;
  };
  paymentMethods: PaymentMethodOption[];
};

export function PosScreen({ sessionInfo, paymentMethods }: Props) {
  const router = useRouter();
  const addLine = useCart((s) => s.addLine);
  const clear = useCart((s) => s.clear);
  const lines = useCart((s) => s.lines);
  const discount = useCart((s) => s.discount);

  const [focusToken, setFocusToken] = useState(0);
  const [pickerProduct, setPickerProduct] = useState<SearchResult | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [insufficient, setInsufficient] = useState<
    InsufficientStockLine[] | null
  >(null);
  const [printSaleId, setPrintSaleId] = useState<string | null>(null);
  const [printNonce, setPrintNonce] = useState(0);
  const [isPending, startTransition] = useTransition();

  const totals = computeTotals(lines, discount);

  const refocus = useCallback(() => setFocusToken((t) => t + 1), []);

  const handleDirectAdd = useCallback(
    (product: SearchResult, presentationId: string) => {
      const pres = product.presentations.find((p) => p.id === presentationId);
      if (!pres) return;
      addLine({
        productId: product.id,
        productUnitId: pres.id,
        name: product.name,
        image: product.image,
        unitSymbol: pres.unitSymbol,
        unitCode: pres.unitCode,
        presentationLabel:
          pres.factor === 1
            ? `${pres.unitName}`
            : `${pres.unitName} × ${pres.factor} ${product.unitSymbol}`,
        unitPrice: pres.salePrice,
        quantity: 1,
      });
      toast.success(`Agregado: ${product.name.toUpperCase()}`, {
        duration: 1500,
      });
      refocus();
    },
    [addLine, refocus],
  );

  const handleNeedsPicker = useCallback((product: SearchResult) => {
    setPickerProduct(product);
  }, []);

  const handlePickerConfirm = useCallback(
    (presentation: Presentation, quantity: number) => {
      if (!pickerProduct) return;
      addLine({
        productId: pickerProduct.id,
        productUnitId: presentation.id,
        name: pickerProduct.name,
        image: pickerProduct.image,
        unitSymbol: presentation.unitSymbol,
        unitCode: presentation.unitCode,
        presentationLabel:
          presentation.factor === 1
            ? `${presentation.unitName}`
            : `${presentation.unitName} × ${presentation.factor} ${pickerProduct.unitSymbol}`,
        unitPrice: presentation.salePrice,
        quantity,
      });
      toast.success(`Agregado: ${pickerProduct.name.toUpperCase()}`, {
        duration: 1500,
      });
      setPickerProduct(null);
      refocus();
    },
    [pickerProduct, addLine, refocus],
  );

  const openPayment = useCallback(() => {
    if (lines.length === 0) {
      toast.warning("El carrito está vacío");
      return;
    }
    setPaymentOpen(true);
  }, [lines.length]);

  const handleConfirmPayment = useCallback(
    (payment: {
      paymentMethodId: string;
      amount: number;
      reference: string;
    }) => {
      startTransition(async () => {
        const result = await createSale({
          items: lines.map((l) => ({
            productUnitId: l.productUnitId,
            quantity: l.quantity,
          })),
          discount,
          payment: {
            paymentMethodId: payment.paymentMethodId,
            amount: payment.amount,
            reference: payment.reference,
          },
          notes: "",
        });

        if (result.ok) {
          toast.success(`Venta ${result.data.code} registrada`);
          setPaymentOpen(false);
          // Disparar impresión (incrementar nonce permite reimprimir misma venta)
          setPrintSaleId(result.data.id);
          setPrintNonce((n) => n + 1);
          clear();
          router.refresh();
          refocus();
        } else {
          if (result.insufficientStock) {
            setPaymentOpen(false);
            setInsufficient(result.insufficientStock);
          } else {
            toast.error(result.error);
          }
        }
      });
    },
    [lines, discount, clear, router, refocus],
  );

  // Atajos de teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Si hay dialogs abiertos, no interceptar (excepto Esc que cada dialog maneja)
      if (paymentOpen || pickerProduct || insufficient) return;

      if (e.key === "F2") {
        e.preventDefault();
        refocus();
        return;
      }
      if (e.key === "F4") {
        e.preventDefault();
        openPayment();
        return;
      }
      if (e.key === "F8") {
        e.preventDefault();
        router.push("/ventas");
        return;
      }
      if (e.key === "Escape") {
        if (lines.length > 0) {
          e.preventDefault();
          clear();
          toast.info("Carrito limpiado");
          refocus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    paymentOpen,
    pickerProduct,
    insufficient,
    lines.length,
    clear,
    refocus,
    openPayment,
    router,
  ]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Sub-header con info de caja */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2.5">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="font-semibold uppercase">
              {sessionInfo.cashRegisterName}
            </span>
            <span className="text-muted-foreground uppercase">
              · {sessionInfo.storeCode}
            </span>
          </div>
          <div className="hidden text-muted-foreground sm:block">
            Vendedor: <span className="uppercase">{sessionInfo.vendorName}</span>
          </div>
          <div className="hidden text-muted-foreground md:block">
            Esperado:{" "}
            <span className="font-mono">
              {formatCurrency(sessionInfo.expectedAmount)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/ventas">
              <Receipt className="mr-1 h-4 w-4" />
              Mis ventas (F8)
            </Link>
          </Button>
          <Button variant="destructive" size="sm" asChild>
            <Link href="/caja/cerrar">
              <Lock className="mr-1 h-4 w-4" />
              Cerrar caja
            </Link>
          </Button>
        </div>
      </div>

      {/* Split-screen: left search + tips, right cart */}
      <div className="grid flex-1 gap-3 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-3">
          <PosSearch
            focusToken={focusToken}
            storeId={sessionInfo.storeId}
            onDirectAdd={handleDirectAdd}
            onNeedsPicker={handleNeedsPicker}
            onNoStock={(product) => {
              toast.error(
                `${product.name.toUpperCase()} no tiene stock en ${sessionInfo.storeCode}`,
              );
              refocus();
            }}
          />
          <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground">
            <p className="mb-2 font-semibold uppercase tracking-wider">
              Atajos
            </p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
              <li>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  F2
                </kbd>{" "}
                foco al buscador
              </li>
              <li>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  F4
                </kbd>{" "}
                cobrar
              </li>
              <li>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  F8
                </kbd>{" "}
                mis ventas
              </li>
              <li>
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  Esc
                </kbd>{" "}
                limpiar carrito
              </li>
              <li className="col-span-2">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                  Enter
                </kbd>{" "}
                en el buscador: si hay match exacto por SKU o código de barras, agrega directo
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <PosCart onCobrar={openPayment} />
        </div>
      </div>

      <PresentationPicker
        product={pickerProduct}
        onClose={() => {
          setPickerProduct(null);
          refocus();
        }}
        onConfirm={handlePickerConfirm}
      />

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={(o) => {
          setPaymentOpen(o);
          if (!o) refocus();
        }}
        total={totals.total}
        methods={paymentMethods}
        isPending={isPending}
        onConfirm={handleConfirmPayment}
      />

      <InsufficientStockDialog
        lines={insufficient}
        onClose={() => {
          setInsufficient(null);
          refocus();
        }}
      />

      <PrintFrame saleId={printSaleId} nonce={printNonce} />
    </div>
  );
}
