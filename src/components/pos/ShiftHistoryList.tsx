import { useState } from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { useShifts } from '../../hooks/useShifts';
import { Shift } from '../../types';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';
import { ShiftDetailModal } from './ShiftDetailModal';

export function ShiftHistoryList() {
  const { shifts, isLoading, error } = useShifts();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>;
  }

  if (shifts.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">Belum ada riwayat shift</div>;
  }

  return (
    <>
      <div className="space-y-2">
        {shifts.map((shift) => (
          <button
            key={shift.id}
            onClick={() => setSelectedShift(shift)}
            className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all active:scale-[0.99] text-left animate-fadeIn"
          >
            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet size={16} className="text-emerald-700" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-800 text-sm font-medium truncate">{shift.cashier_name ?? '-'}</span>
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0',
                  shift.status === 'open' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-500'
                )}>
                  {shift.status === 'open' ? 'Sedang Berjalan' : 'Selesai'}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {formatDateTime(shift.opened_at)}
                {shift.closed_at && ` — ${formatDateTime(shift.closed_at)}`}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-slate-800 text-xs font-semibold">Kas awal {formatCurrency(shift.opening_cash)}</p>
              {shift.cash_difference != null && (
                <p className={cn(
                  'text-xs font-medium',
                  shift.cash_difference === 0 ? 'text-green-600' : shift.cash_difference > 0 ? 'text-blue-600' : 'text-red-600'
                )}>
                  {shift.cash_difference === 0 ? 'Sesuai' : `Selisih ${formatCurrency(Math.abs(shift.cash_difference))}`}
                </p>
              )}
            </div>

            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      <ShiftDetailModal shift={selectedShift} onClose={() => setSelectedShift(null)} />
    </>
  );
}
