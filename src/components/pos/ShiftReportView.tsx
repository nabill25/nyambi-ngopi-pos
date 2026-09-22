import { forwardRef } from 'react';
import { formatCurrency, formatDateTime } from '../../lib/utils';

interface ShiftReportViewProps {
  storeName: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string | null;
  openingCash: number;
  totalOrders: number;
  cashTotal: number;
  qrisTotal: number;
  transferTotal: number;
  grandTotal: number;
  expectedCash: number;
  closingCash?: number | null;
  difference?: number | null;
  notes?: string | null;
}

/** Printable Z-report content for a shift, shared by the close-shift flow and shift history. */
export const ShiftReportView = forwardRef<HTMLDivElement, ShiftReportViewProps>(function ShiftReportView(
  {
    storeName,
    cashierName,
    openedAt,
    closedAt,
    openingCash,
    totalOrders,
    cashTotal,
    qrisTotal,
    transferTotal,
    grandTotal,
    expectedCash,
    closingCash,
    difference,
    notes,
  },
  ref
) {
  const isClosed = closedAt != null && closingCash != null && difference != null;

  return (
    <div
      ref={ref}
      className="bg-white text-black font-mono text-xs p-4 rounded-xl mx-auto"
      style={{ maxWidth: '280px', minWidth: '220px' }}
    >
      <div className="text-center mb-3">
        <p className="font-bold text-sm">{storeName}</p>
        <p className="text-xs">Laporan Tutup Kasir (Z-Report)</p>
      </div>
      <div className="border-t border-dashed border-gray-400 my-2" />
      <div className="flex justify-between text-xs"><span>Kasir</span><span>{cashierName}</span></div>
      <div className="flex justify-between text-xs"><span>Dibuka</span><span>{formatDateTime(openedAt)}</span></div>
      <div className="flex justify-between text-xs">
        <span>Ditutup</span>
        <span>{isClosed && closedAt ? formatDateTime(closedAt) : 'Sedang berjalan'}</span>
      </div>
      <div className="border-t border-dashed border-gray-400 my-2" />
      <div className="flex justify-between text-xs"><span>Kas Awal</span><span>{formatCurrency(openingCash)}</span></div>
      <div className="flex justify-between text-xs"><span>Total Transaksi</span><span>{totalOrders}</span></div>
      <div className="flex justify-between text-xs"><span>Tunai</span><span>{formatCurrency(cashTotal)}</span></div>
      <div className="flex justify-between text-xs"><span>QRIS</span><span>{formatCurrency(qrisTotal)}</span></div>
      <div className="flex justify-between text-xs"><span>Transfer</span><span>{formatCurrency(transferTotal)}</span></div>
      <div className="border-t border-gray-800 my-1" />
      <div className="flex justify-between font-bold text-sm"><span>TOTAL PENJUALAN</span><span>{formatCurrency(grandTotal)}</span></div>
      <div className="border-t border-dashed border-gray-400 my-2" />
      <div className="flex justify-between text-xs"><span>Kas Seharusnya</span><span>{formatCurrency(expectedCash)}</span></div>
      {isClosed ? (
        <>
          <div className="flex justify-between text-xs"><span>Kas Fisik</span><span>{formatCurrency(closingCash!)}</span></div>
          <div className="flex justify-between font-bold text-xs">
            <span>Selisih</span>
            <span>{difference === 0 ? 'Sesuai' : `${difference! > 0 ? '+' : ''}${formatCurrency(difference!)}`}</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500 mt-1">Shift belum ditutup — belum ada kas fisik/selisih.</p>
      )}
      {notes && (
        <>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <p className="text-xs">Catatan: {notes}</p>
        </>
      )}
      <div className="border-t border-dashed border-gray-400 my-2" />
      <p className="text-center text-xs text-gray-500">— Nyambi Ngopi POS —</p>
    </div>
  );
});
