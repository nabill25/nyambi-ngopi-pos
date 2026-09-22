import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Printer } from 'lucide-react';
import { useShiftStore } from '../../store/shiftStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Shift, ShiftSummary } from '../../types';
import { ShiftReportView } from './ShiftReportView';

interface ShiftDetailModalProps {
  shift: Shift | null;
  onClose: () => void;
}

export function ShiftDetailModal({ shift, onClose }: ShiftDetailModalProps) {
  const { getSummary } = useShiftStore();
  const { settings } = useSettingsStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shift) return;
    setIsLoading(true);
    setError(null);
    setSummary(null);
    getSummary(shift.id, shift.opening_cash)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan shift'))
      .finally(() => setIsLoading(false));
  }, [shift, getSummary]);

  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Laporan Shift</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: monospace; font-size: 12px; margin: 0; }
        * { box-sizing: border-box; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, []);

  if (!shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm flex-1">Detail Shift</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm">{error}</div>
          ) : summary ? (
            <ShiftReportView
              ref={receiptRef}
              storeName={settings.store_name}
              cashierName={shift.cashier_name ?? '-'}
              openedAt={shift.opened_at}
              closedAt={shift.closed_at}
              openingCash={shift.opening_cash}
              totalOrders={summary.totalOrders}
              cashTotal={summary.cashTotal}
              qrisTotal={summary.qrisTotal}
              transferTotal={summary.transferTotal}
              grandTotal={summary.grandTotal}
              expectedCash={summary.expectedCash}
              closingCash={shift.closing_cash}
              difference={shift.cash_difference}
              notes={shift.notes}
            />
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handlePrint}
            disabled={isLoading || !summary}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-800 hover:border-slate-300 transition-all active:scale-95 text-sm disabled:opacity-50"
          >
            <Printer size={16} />
            <span>Cetak</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
