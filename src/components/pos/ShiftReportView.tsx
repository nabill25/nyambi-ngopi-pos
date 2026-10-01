import { ShiftCashFlow, ShiftReportData } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { cashFlowLabel, groupCashFlows, isShiftReportClosed } from '../../lib/shiftReport';

interface ShiftReportViewProps {
  report: ShiftReportData;
}

/** Z-report preview for a shift, shared by the close-shift flow and shift history. Printing is done via buildShiftReportHTML / buildShiftReportEscPos. */
export function ShiftReportView({ report }: ShiftReportViewProps) {
  const { cashOut, cashIn, cashOutTotal, cashInTotal } = groupCashFlows(report.cashFlows);

  return (
    <div
      className="bg-white text-black font-mono text-xs p-4 rounded-xl mx-auto"
      style={{ maxWidth: '280px', minWidth: '220px' }}
    >
      <div className="text-center mb-3">
        <p className="font-bold text-sm">{report.storeName}</p>
        <p className="text-xs">Laporan Tutup Kasir (Z-Report)</p>
      </div>
      <div className="border-t border-dashed border-gray-400 my-2" />
      <div className="flex justify-between text-xs"><span>Kasir</span><span>{report.cashierName}</span></div>
      <div className="flex justify-between text-xs"><span>Dibuka</span><span>{formatDateTime(report.openedAt)}</span></div>
      <div className="flex justify-between text-xs">
        <span>Ditutup</span>
        <span>{isShiftReportClosed(report) ? formatDateTime(report.closedAt) : 'Sedang berjalan'}</span>
      </div>
      <div className="border-t border-dashed border-gray-400 my-2" />
      <div className="flex justify-between text-xs"><span>Kas Awal</span><span>{formatCurrency(report.openingCash)}</span></div>
      <div className="flex justify-between text-xs"><span>Total Transaksi</span><span>{report.totalOrders}</span></div>
      <div className="flex justify-between text-xs"><span>Tunai</span><span>{formatCurrency(report.cashTotal)}</span></div>
      <div className="flex justify-between text-xs"><span>QRIS</span><span>{formatCurrency(report.qrisTotal)}</span></div>
      <div className="flex justify-between text-xs"><span>Transfer</span><span>{formatCurrency(report.transferTotal)}</span></div>
      <div className="border-t border-gray-800 my-1" />
      <div className="flex justify-between font-bold text-sm"><span>TOTAL PENJUALAN</span><span>{formatCurrency(report.grandTotal)}</span></div>
      <div className="border-t border-dashed border-gray-400 my-2" />
      <CashFlowSection title="Kas Keluar" sign="-" flows={cashOut} total={cashOutTotal} />
      <CashFlowSection title="Kas Masuk" sign="+" flows={cashIn} total={cashInTotal} />
      <div className="flex justify-between text-xs"><span>Kas Seharusnya</span><span>{formatCurrency(report.expectedCash)}</span></div>
      {isShiftReportClosed(report) ? (
        <>
          <div className="flex justify-between text-xs"><span>Kas Fisik</span><span>{formatCurrency(report.closingCash)}</span></div>
          <div className="flex justify-between font-bold text-xs">
            <span>Selisih</span>
            <span>{report.difference === 0 ? 'Sesuai' : `${report.difference > 0 ? '+' : ''}${formatCurrency(report.difference)}`}</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500 mt-1">Shift belum ditutup — belum ada kas fisik/selisih.</p>
      )}
      {report.notes && (
        <>
          <div className="border-t border-dashed border-gray-400 my-2" />
          <p className="text-xs">Catatan: {report.notes}</p>
        </>
      )}
      <div className="border-t border-dashed border-gray-400 my-2" />
      <p className="text-center text-xs text-gray-500">— Nyambi Ngopi POS —</p>
    </div>
  );
}

interface CashFlowSectionProps {
  title: string;
  sign: '-' | '+';
  flows: ShiftCashFlow[];
  total: number;
}

// Daftar kas keluar/masuk laci selama shift: keterangan + nominal per entri
function CashFlowSection({ title, sign, flows, total }: CashFlowSectionProps) {
  if (flows.length === 0) return null;

  return (
    <>
      <p className="font-bold text-xs">{title}</p>
      {flows.map((flow) => (
        <div key={flow.id} className="flex justify-between gap-2 text-xs">
          <span className="flex-1 break-words">{cashFlowLabel(flow)}</span>
          <span className="flex-shrink-0">{sign}{formatCurrency(flow.amount)}</span>
        </div>
      ))}
      {flows.length > 1 && (
        <div className="flex justify-between font-bold text-xs">
          <span>Total {title}</span>
          <span>{sign}{formatCurrency(total)}</span>
        </div>
      )}
      <div className="border-t border-dashed border-gray-400 my-2" />
    </>
  );
}
