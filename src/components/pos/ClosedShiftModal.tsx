import { Printer, CheckCircle2 } from 'lucide-react';
import { useShiftStore } from '../../store/shiftStore';
import { useSettingsStore } from '../../store/settingsStore';
import { usePrinter } from '../../hooks/usePrinter';
import { toShiftReportData } from '../../lib/shiftReport';
import { ShiftReportView } from './ShiftReportView';

/** Struk tutup kasir (Laporan Z) yang tampil begitu shift ditutup. Pencetakan otomatisnya dipicu CloseShiftModal. */
export function ClosedShiftModal() {
  const { closedShift, dismissClosedShift } = useShiftStore();
  const { settings } = useSettingsStore();
  const { printShiftReport } = usePrinter();

  if (!closedShift) return null;

  const report = toShiftReportData(closedShift.shift, closedShift.summary, settings.store_name);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center animate-scaleIn">
            <CheckCircle2 size={16} className="text-green-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800 text-sm">Kasir Ditutup</h2>
            <p className="text-slate-500 text-xs">Laporan Z (rekonsiliasi akhir shift)</p>
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <ShiftReportView report={report} />
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={() => printShiftReport(report, settings)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-800 hover:border-slate-300 transition-all active:scale-95 text-sm"
          >
            <Printer size={16} />
            <span>Cetak</span>
          </button>
          <button
            onClick={dismissClosedShift}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
