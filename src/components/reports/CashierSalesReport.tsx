import { Users } from 'lucide-react';
import { CashierSales } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/utils';

interface CashierSalesReportProps {
  data: CashierSales[];
  isLoading: boolean;
}

// Penjualan tiap akun kasir pada periode laporan (jumlah transaksi, total, dan rincian metode bayar)
export function CashierSalesReport({ data, isLoading }: CashierSalesReportProps) {
  const grandTotal = data.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-emerald-400" />
        <h3 className="text-slate-800 font-semibold text-sm">Penjualan per Kasir</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Tidak ada data</p>
      ) : (
        <div className="space-y-4">
          {data.map((row) => {
            const share = grandTotal > 0 ? (row.total / grandTotal) * 100 : 0;
            return (
              <div key={row.key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {row.cashier_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-xs font-medium truncate">{row.cashier_name}</p>
                    <p className="text-slate-500 text-[11px]">{formatNumber(row.order_count)} transaksi · {Math.round(share)}% dari total</p>
                  </div>
                  <span className="text-emerald-600 text-sm font-semibold flex-shrink-0">{formatCurrency(row.total)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-9">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${share}%` }}
                  />
                </div>
                <p className="text-slate-500 text-[11px] ml-9">
                  Tunai {formatCurrency(row.cash_total)} · QRIS {formatCurrency(row.qris_total)} · Transfer {formatCurrency(row.transfer_total)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
