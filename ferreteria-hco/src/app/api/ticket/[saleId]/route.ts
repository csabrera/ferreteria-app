import { NextResponse, type NextRequest } from "next/server";

import { requireSession } from "@/lib/auth-guards";
import { getSaleForTicket } from "@/server/queries/sale.queries";
import { getSettings } from "@/server/queries/settings.queries";
import { formatCurrency, formatDateTime, formatQuantity } from "@/lib/format";

/**
 * HTML del ticket interno (no fiscal). Estilo angosto ~80mm para que sea
 * compatible con impresoras térmicas en F2 (solo cambia el medio de impresión).
 *
 * GET /api/ticket/[saleId] → returns text/html
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { saleId: string } },
) {
  await requireSession();

  const [sale, settings] = await Promise.all([
    getSaleForTicket(params.saleId),
    getSettings(),
  ]);

  if (!sale) {
    return new NextResponse("Venta no encontrada", { status: 404 });
  }

  const subtotal = Number(sale.subtotal);
  const discount = Number(sale.discount);
  const total = Number(sale.total);

  // IGV discriminado a partir del total (precio bruto)
  // base = total / (1 + igv/100), igv = total - base
  const igvPct = Number(settings.igvPercent);
  const baseImponible = igvPct > 0 ? +(total / (1 + igvPct / 100)).toFixed(2) : total;
  const igvAmount = +(total - baseImponible).toFixed(2);

  const vendor =
    `${sale.user.firstName} ${sale.user.lastNameP} ${sale.user.lastNameM}`
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();

  const itemsRows = sale.items
    .map((it) => {
      const qty = formatQuantity(Number(it.quantity));
      const unit = it.productUnit.unit.symbol;
      const price = formatCurrency(Number(it.unitPrice), settings.currencySymbol);
      const lineTotal = formatCurrency(
        Number(it.lineTotal),
        settings.currencySymbol,
      );
      return `<tr>
        <td colspan="3" class="prod">${escapeHtml(it.product.name.toUpperCase())}</td>
      </tr>
      <tr>
        <td class="qty">${qty} ${unit}</td>
        <td class="price">${price}</td>
        <td class="line-total">${lineTotal}</td>
      </tr>`;
    })
    .join("");

  const paymentRow = sale.payments
    .map(
      (p) =>
        `<tr>
          <td colspan="2">${escapeHtml(p.paymentMethod.name)}${
            p.reference ? ` <span class="muted">(${escapeHtml(p.reference)})</span>` : ""
          }</td>
          <td class="right">${formatCurrency(Number(p.amount), settings.currencySymbol)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Ticket ${escapeHtml(sale.code)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', ui-monospace, Menlo, monospace;
    color: #000;
    background: #fff;
    font-size: 11px;
    line-height: 1.35;
  }
  .ticket {
    width: 80mm;
    max-width: 80mm;
    padding: 6mm 4mm;
    margin: 0 auto;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .muted { color: #555; }
  .business {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .small { font-size: 10px; }
  hr {
    border: none;
    border-top: 1px dashed #000;
    margin: 4px 0;
  }
  table { width: 100%; border-collapse: collapse; }
  td.prod { padding-top: 2px; font-weight: 600; text-transform: uppercase; }
  td.qty { width: 32%; }
  td.price { width: 30%; text-align: right; }
  td.line-total { width: 38%; text-align: right; font-weight: 600; }
  .totals td { padding: 1px 0; }
  .totals td.right { text-align: right; }
  .total-row td { font-size: 14px; font-weight: 700; padding-top: 4px; border-top: 1px solid #000; }
  .footer { text-align: center; margin-top: 8px; }
  .thanks { font-weight: 700; }
  .header-block { white-space: pre-line; text-align: center; }
  .logo { max-width: 30mm; max-height: 15mm; object-fit: contain; }
  @page { size: 80mm auto; margin: 0; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
  /* Botón de imprimir visible solo en pantalla, no en print */
  .actions { text-align: center; margin: 12px 0; }
  .actions button {
    font-family: inherit;
    background: #000;
    color: #fff;
    border: none;
    padding: 6px 14px;
    font-size: 11px;
    cursor: pointer;
  }
  @media print {
    .actions { display: none; }
  }
</style>
</head>
<body>
  <div class="ticket">
    ${
      settings.showLogoOnTicket && settings.logoUrl
        ? `<div class="center"><img class="logo" src="${escapeHtml(settings.logoUrl)}" alt="" /></div>`
        : ""
    }
    <div class="business center">${escapeHtml(settings.businessName)}</div>
    ${settings.ruc ? `<div class="center small">RUC ${escapeHtml(settings.ruc)}</div>` : ""}
    ${
      sale.store.address
        ? `<div class="center small">${escapeHtml(sale.store.address.toUpperCase())}</div>`
        : ""
    }
    ${
      sale.store.phone
        ? `<div class="center small">Tel. ${escapeHtml(sale.store.phone)}</div>`
        : ""
    }
    ${
      settings.ticketHeader
        ? `<hr/><div class="header-block small">${escapeHtml(settings.ticketHeader)}</div>`
        : ""
    }

    <hr/>
    <div class="center"><strong>COMPROBANTE INTERNO</strong></div>
    <div class="center small">No es comprobante fiscal</div>
    <hr/>

    <table class="small">
      <tr><td>N°</td><td class="right"><strong>${escapeHtml(sale.code)}</strong></td></tr>
      <tr><td>Fecha</td><td class="right">${formatDateTime(sale.createdAt)}</td></tr>
      <tr><td>Caja</td><td class="right">${escapeHtml(sale.cashSession.cashRegister.name.toUpperCase())}</td></tr>
      <tr><td>Sucursal</td><td class="right">${escapeHtml(sale.store.code)} — ${escapeHtml(sale.store.name.toUpperCase())}</td></tr>
      <tr><td>Vendedor</td><td class="right">${escapeHtml(vendor)}</td></tr>
    </table>

    <hr/>
    <table>
      ${itemsRows}
    </table>

    <hr/>
    <table class="totals small">
      ${igvPct > 0 ? `<tr><td>Base imponible</td><td class="right">${formatCurrency(baseImponible, settings.currencySymbol)}</td></tr>` : ""}
      ${igvPct > 0 ? `<tr><td>IGV (${igvPct.toFixed(2)}%)</td><td class="right">${formatCurrency(igvAmount, settings.currencySymbol)}</td></tr>` : ""}
      ${
        discount > 0
          ? `<tr><td>Subtotal</td><td class="right">${formatCurrency(subtotal, settings.currencySymbol)}</td></tr>
             <tr><td>Descuento</td><td class="right">−${formatCurrency(discount, settings.currencySymbol)}</td></tr>`
          : ""
      }
      <tr class="total-row"><td>TOTAL</td><td class="right">${formatCurrency(total, settings.currencySymbol)}</td></tr>
    </table>

    <hr/>
    <table class="small">
      ${paymentRow}
    </table>

    ${
      settings.ticketFooter
        ? `<hr/><div class="header-block small">${escapeHtml(settings.ticketFooter)}</div>`
        : ""
    }
    <div class="footer">
      <p class="thanks">${escapeHtml(settings.thankYouMessage)}</p>
    </div>

    <div class="actions">
      <button onclick="window.print()" type="button">Imprimir</button>
    </div>
  </div>
  <script>
    // Auto-print al cargar si viene desde print=1 (iframe del POS)
    (function() {
      var p = new URLSearchParams(window.location.search);
      if (p.get('print') === '1') {
        setTimeout(function() { window.print(); }, 200);
      }
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
