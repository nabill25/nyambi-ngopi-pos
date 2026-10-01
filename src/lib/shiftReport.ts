import { Shift, ShiftCashFlow, ShiftOrderLine, ShiftReportData, ShiftSummary, StoreSettings } from '../types';
import { EscPosEncoder, toPrintableAscii } from './escpos';
import { escapeHtml, formatCurrency, formatDateTime, formatTime, getPaymentMethodLabel } from './utils';

type PaperSize = StoreSettings['receipt_paper_size'];

export type ClosedShiftReportData = ShiftReportData & { closedAt: string; closingCash: number; difference: number };

// Struk sudah "final" hanya jika shift sudah ditutup dan kas fisik/selisihnya tercatat
export function isShiftReportClosed(report: ShiftReportData): report is ClosedShiftReportData {
  return report.closedAt != null && report.closingCash != null && report.difference != null;
}

// Gabungkan baris shift + ringkasan hitungan jadi isi struk tutup kasir
export function toShiftReportData(shift: Shift, summary: ShiftSummary, storeName: string): ShiftReportData {
  return {
    storeName,
    cashierName: shift.cashier_name ?? '-',
    openedAt: shift.opened_at,
    closedAt: shift.closed_at,
    openingCash: shift.opening_cash,
    totalOrders: summary.totalOrders,
    cashTotal: summary.cashTotal,
    qrisTotal: summary.qrisTotal,
    transferTotal: summary.transferTotal,
    grandTotal: summary.grandTotal,
    cashFlows: summary.cashFlows,
    orders: summary.orders,
    expectedCash: summary.expectedCash,
    closingCash: shift.closing_cash,
    difference: shift.cash_difference,
    notes: shift.notes,
  };
}

// Kolom description boleh kosong di database, jadi selalu beri teks pengganti
export function cashFlowLabel(flow: ShiftCashFlow): string {
  return flow.description?.trim() || 'Tanpa keterangan';
}

export function groupCashFlows(flows: ShiftCashFlow[]) {
  const sum = (list: ShiftCashFlow[]) => list.reduce((total, f) => total + f.amount, 0);
  const cashOut = flows.filter((f) => f.type === 'out');
  const cashIn = flows.filter((f) => f.type === 'in');
  return { cashOut, cashIn, cashOutTotal: sum(cashOut), cashInTotal: sum(cashIn) };
}

// Build the full print-ready HTML for the close-shift report (thermal-style, same look as buildReceiptHTML)
export function buildShiftReportHTML(report: ShiftReportData, paperSize: PaperSize = '80mm'): string {
  const { cashOut, cashIn, cashOutTotal, cashInTotal } = groupCashFlows(report.cashFlows);

  const row = (label: string, value: string, className = 'row') =>
    `<div class="${className}"><span>${label}</span><span>${value}</span></div>`;

  const flowSection = (title: string, sign: '-' | '+', flows: ShiftCashFlow[], total: number) => {
    if (flows.length === 0) return '';
    const rows = flows
      .map((f) => `<div class="row"><span class="desc">${escapeHtml(cashFlowLabel(f))}</span><span>${sign}${formatCurrency(f.amount)}</span></div>`)
      .join('');
    const totalRow = flows.length > 1 ? row(`Total ${title}`, `${sign}${formatCurrency(total)}`, 'row bold') : '';
    return `<div class="bold">${title}</div>${rows}${totalRow}<div class="dash"></div>`;
  };

  const closingRows = isShiftReportClosed(report)
    ? row('Kas Fisik', formatCurrency(report.closingCash))
      + row('Selisih', report.difference === 0 ? 'Sesuai' : `${report.difference > 0 ? '+' : ''}${formatCurrency(report.difference)}`, 'row bold')
    : '<div class="sm">Shift belum ditutup — belum ada kas fisik/selisih.</div>';
  const closedAtText = isShiftReportClosed(report) ? formatDateTime(report.closedAt) : 'Sedang berjalan';
  const notesBlock = report.notes ? `<div class="dash"></div><div>Catatan: ${escapeHtml(report.notes)}</div>` : '';

  // Daftar tiap transaksi selesai pada shift ini: nomor struk + total, lalu jam + metode bayar
  const orderRow = (o: ShiftOrderLine) =>
    `<div class="tx"><div class="row"><span class="desc">${escapeHtml(o.order_number)}</span><span>${formatCurrency(o.total_amount)}</span></div>`
    + `<div class="sm">${formatTime(o.created_at)} · ${getPaymentMethodLabel(o.payment_method)}</div></div>`;
  const ordersBlock = report.orders.length > 0
    ? `<div class="dash"></div><div class="bold">Daftar Transaksi (${report.orders.length})</div>${report.orders.map(orderRow).join('')}`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan Tutup Kasir</title>
<style>
  @page { size: ${paperSize} auto; margin: 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #111; background: #fff; width: 100%; }
  .center { text-align: center; }
  .dash { border-top: 1px dashed #aaa; margin: 6px 0; }
  .solid { border-top: 2px solid #111; margin: 4px 0; }
  .bold { font-weight: 700; }
  .row { display: flex; justify-content: space-between; }
  .desc { flex: 1; padding-right: 8px; word-break: break-word; }
  .tx { margin-top: 3px; }
  .sm { font-size: 10px; color: #555; }
  .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; }
</style></head><body>
  <div class="center">
    <div class="bold" style="font-size:14px;">${escapeHtml(report.storeName)}</div>
    <div class="sm">Laporan Tutup Kasir (Z-Report)</div>
  </div>

  <div class="dash"></div>
  ${row('Kasir', escapeHtml(report.cashierName))}
  ${row('Dibuka', formatDateTime(report.openedAt))}
  ${row('Ditutup', closedAtText)}
  <div class="dash"></div>

  ${row('Kas Awal', formatCurrency(report.openingCash))}
  ${row('Total Transaksi', String(report.totalOrders))}
  ${row('Tunai', formatCurrency(report.cashTotal))}
  ${row('QRIS', formatCurrency(report.qrisTotal))}
  ${row('Transfer', formatCurrency(report.transferTotal))}
  <div class="solid"></div>
  <div class="total-row"><span>TOTAL PENJUALAN</span><span>${formatCurrency(report.grandTotal)}</span></div>
  <div class="dash"></div>

  ${flowSection('Kas Keluar', '-', cashOut, cashOutTotal)}${flowSection('Kas Masuk', '+', cashIn, cashInTotal)}
  ${row('Kas Seharusnya', formatCurrency(report.expectedCash))}
  ${closingRows}
  ${notesBlock}
  ${ordersBlock}

  <div class="dash"></div>
  <div class="center sm" style="color:#999;">— Nyambi Ngopi POS —</div>
  <div style="height:8px;"></div>
</body></html>`;
}

// Build ESC/POS bytes for the close-shift report (printer thermal Bluetooth)
export function buildShiftReportEscPos(report: ShiftReportData, paperSize: PaperSize = '80mm'): Uint8Array {
  const width = paperSize === '80mm' ? 48 : 32;
  const idr = (amount: number) => toPrintableAscii(formatCurrency(amount));
  const { cashOut, cashIn, cashOutTotal, cashInTotal } = groupCashFlows(report.cashFlows);
  const e = new EscPosEncoder();

  e.align('center')
   .bold(true)
   .size(2, 2)
   .text(toPrintableAscii(report.storeName))
   .newline(2)
   .size(1, 1)
   .bold(false)
   .text('Laporan Tutup Kasir (Z-Report)')
   .newline(2);

  e.align('left')
   .twoColumn('Kasir', toPrintableAscii(report.cashierName), width)
   .twoColumn('Dibuka', formatDateTime(report.openedAt), width)
   .twoColumn('Ditutup', isShiftReportClosed(report) ? formatDateTime(report.closedAt) : 'Sedang berjalan', width)
   .line('-', width)
   .twoColumn('Kas Awal', idr(report.openingCash), width)
   .twoColumn('Total Transaksi', String(report.totalOrders), width)
   .twoColumn('Tunai', idr(report.cashTotal), width)
   .twoColumn('QRIS', idr(report.qrisTotal), width)
   .twoColumn('Transfer', idr(report.transferTotal), width)
   .line('-', width)
   .bold(true)
   .twoColumn('TOTAL PENJUALAN', idr(report.grandTotal), width)
   .bold(false)
   .line('-', width);

  const flowSection = (title: string, sign: '-' | '+', flows: ShiftCashFlow[], total: number) => {
    if (flows.length === 0) return;
    e.bold(true).text(title).newline().bold(false);
    flows.forEach((f) => {
      const label = `- ${toPrintableAscii(cashFlowLabel(f)).trim() || 'Tanpa keterangan'}`;
      const amount = `${sign}${idr(f.amount)}`;
      // Keterangan panjang ditaruh di baris sendiri supaya nominal tetap rata kanan
      if (label.length + amount.length < width) {
        e.twoColumn(label, amount, width);
      } else {
        e.text(label).newline().twoColumn('', amount, width);
      }
    });
    if (flows.length > 1) {
      e.bold(true).twoColumn(`Total ${title}`, `${sign}${idr(total)}`, width).bold(false);
    }
    e.line('-', width);
  };
  flowSection('Kas Keluar', '-', cashOut, cashOutTotal);
  flowSection('Kas Masuk', '+', cashIn, cashInTotal);

  e.twoColumn('Kas Seharusnya', idr(report.expectedCash), width);
  if (isShiftReportClosed(report)) {
    const difference = report.difference === 0
      ? 'Sesuai'
      : `${report.difference > 0 ? '+' : '-'}${idr(Math.abs(report.difference))}`;
    e.twoColumn('Kas Fisik', idr(report.closingCash), width)
     .bold(true)
     .twoColumn('Selisih', difference, width)
     .bold(false);
  } else {
    e.text('Shift belum ditutup').newline();
  }

  const note = report.notes ? toPrintableAscii(report.notes).trim() : '';
  if (note) {
    e.line('-', width).text(`Catatan: ${note}`).newline();
  }

  if (report.orders.length > 0) {
    e.line('-', width)
     .bold(true)
     .text(`Daftar Transaksi (${report.orders.length})`)
     .newline()
     .bold(false);
    report.orders.forEach((order) => {
      e.twoColumn(toPrintableAscii(order.order_number), idr(order.total_amount), width)
       .text(`  ${formatTime(order.created_at)} ${getPaymentMethodLabel(order.payment_method)}`)
       .newline();
    });
  }

  e.newline()
   .align('center')
   .text('-- Nyambi Ngopi POS --')
   .newline(4) // Extra space before cut
   .cut();

  return e.encode();
}
