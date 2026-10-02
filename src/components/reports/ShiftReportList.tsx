import { useState, useMemo } from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { ReportOrder, Shift } from '../../types';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';
import { groupSalesByShift } from '../../lib/reportAggregates';
import { ShiftDetailModal } from '../pos/ShiftDetailModal';

interface ShiftReportListProps {
  shifts: Shift[];
  // Transaksi selesai pada periode laporan yang sama — dipakai menghitung penjualan tiap shift
  orders: ReportOrder[];
  cashierNames: Map<string, string>;
  isLoading: boolean;
}

// Laporan tutup kasir (shift) semua akun kasir pada periode laporan; ketuk satu shift untuk membuka & mencetak ulang Z-report-nya
export function ShiftReportList({ shifts, orders, cashierNames, isLoading }: ShiftReportListProps) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const salesByShift = useMemo(() => groupSalesByShift(orders), [orders]);

  const closedShifts = shifts.filter((s) => s.status === 'closed');
  const totalDifference = closedShifts.reduce((sum, s) => sum + (s.cash_difference ?? 0), 0);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Wallet size={16} className="text-emerald-400" />
        <h3 className="text-slate-800 font-semibold text-sm flex-1">Laporan Tutup Kasir (Shift)</h3>
        {closedShifts.length > 0 && (
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            totalDifference === 0 ? 'bg-green-500/10 text-green-600' : totalDifference > 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600'
          )}>
            {totalDifference === 0 ? 'Kas semua shift sesuai' : `Selisih kas total ${totalDifference > 0 ? '+' : '-'}${formatCurrency(Math.abs(totalDifference))}`}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Tidak ada shift pada periode ini</p>
      ) : (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
          {shifts.map((shift) => {
            const sales = salesByShift.get(shift.id);
            const cashierName = shift.cashier_name ?? (shift.cashier_id ? cashierNames.get(shift.cashier_id) : undefined) ?? '-';
            const isOpen = shift.status === 'open';
            const difference = shift.cash_difference;

            return (
              <button
                key={shift.id}
                onClick={() => setSelectedShift(shift)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all active:scale-[0.99] text-left"
              >
                <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet size={16} className="text-emerald-700" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 text-sm font-medium truncate">{cashierName}</span>
                    <span className={cn(
                      'text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0',
                      isOpen ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-500'
                    )}>
                      {isOpen ? 'Sedang Berjalan' : 'Selesai'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {formatDateTime(shift.opened_at)}
                    {shift.closed_at && ` — ${formatDateTime(shift.closed_at)}`}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Kas awal {formatCurrency(shift.opening_cash)} · Penjualan {formatCurrency(sales?.total ?? 0)} ({sales?.count ?? 0} transaksi)
                  </p>
                </div>

                {difference != null && (
                  <span className={cn(
                    'text-xs font-medium flex-shrink-0 text-right',
                    difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'
                  )}>
                    {difference === 0 ? 'Sesuai' : `${difference > 0 ? 'Lebih' : 'Kurang'} ${formatCurrency(Math.abs(difference))}`}
                  </span>
                )}

                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <ShiftDetailModal shift={selectedShift} onClose={() => setSelectedShift(null)} />
    </div>
  );
}
