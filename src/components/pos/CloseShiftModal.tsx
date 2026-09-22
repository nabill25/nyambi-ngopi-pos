import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, CloudOff, RefreshCw } from 'lucide-react';
import { useShiftStore } from '../../store/shiftStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useOfflineQueueStore } from '../../store/offlineQueueStore';
import { syncOfflineQueue } from '../../hooks/useOrders';
import { formatCurrency, cn } from '../../lib/utils';
import { ShiftSummary } from '../../types';
import { ShiftReportView } from './ShiftReportView';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ClosedResult = ShiftSummary & { closingCash: number; difference: number };

export function CloseShiftModal({ isOpen, onClose }: CloseShiftModalProps) {
  const { currentShift, getSummary, closeShift } = useShiftStore();
  const { settings } = useSettingsStore();
  const { queue, isSyncing } = useOfflineQueueStore();
  const receiptRef = useRef<HTMLDivElement>(null);
  const pendingForShift = queue.filter((q) => q.orderPayload.shift_id === currentShift?.id).length;

  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closedResult, setClosedResult] = useState<ClosedResult | null>(null);

  useEffect(() => {
    if (!isOpen || !currentShift) return;
    setIsFetching(true);
    setError(null);
    setClosedResult(null);
    setActualCash('');
    setNotes('');
    getSummary(currentShift.id, currentShift.opening_cash)
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan'))
      .finally(() => setIsFetching(false));
  }, [isOpen, currentShift, getSummary]);

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? parseInt(num, 10).toLocaleString('id-ID') : '';
  };

  const actualCashNum = parseInt(actualCash.replace(/\D/g, ''), 10) || 0;
  const liveDifference = summary ? actualCashNum - summary.expectedCash : 0;

  const handleConfirmClose = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await closeShift(actualCashNum, notes.trim() || undefined);
      setClosedResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menutup kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Laporan Tutup Kasir</title>
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

  if (!isOpen || !currentShift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={!isSubmitting ? onClose : undefined} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        {!closedResult ? (
          <>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base flex-1">Tutup Kasir</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors" disabled={isSubmitting}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {pendingForShift > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2.5 animate-fadeIn">
                  <div className="flex items-start gap-2">
                    <CloudOff size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700 text-sm">
                      <strong>{pendingForShift} transaksi</strong> shift ini masih tersimpan offline dan belum masuk hitungan kas di bawah. Sinkronkan dulu sebelum tutup kasir supaya rekonsiliasi akurat.
                    </p>
                  </div>
                  <button
                    onClick={() => syncOfflineQueue()}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-xs font-semibold transition-all active:scale-95"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Coba Sinkron Sekarang'}</span>
                  </button>
                </div>
              )}

              {isFetching ? (
                <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Memuat ringkasan...</div>
              ) : summary ? (
                <>
                  <div className="bg-white rounded-xl p-4 space-y-2 border border-slate-100">
                    <Row label="Kas Awal" value={formatCurrency(currentShift.opening_cash)} />
                    <Row label="Total Transaksi" value={`${summary.totalOrders} transaksi`} />
                    <Row label="Penjualan Tunai" value={formatCurrency(summary.cashTotal)} />
                    <Row label="Penjualan QRIS" value={formatCurrency(summary.qrisTotal)} />
                    <Row label="Penjualan Transfer" value={formatCurrency(summary.transferTotal)} />
                    <div className="pt-2 border-t border-slate-200">
                      <Row label="Kas Seharusnya" value={formatCurrency(summary.expectedCash)} bold />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-600 text-xs font-medium">Kas Fisik Dihitung (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={actualCash}
                        onChange={(e) => setActualCash(formatInput(e.target.value))}
                        placeholder="0"
                        autoFocus
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {actualCash && (
                    <div className={cn(
                      'flex justify-between items-center p-3 rounded-xl animate-fadeIn',
                      liveDifference === 0 ? 'bg-green-500/10 border border-green-500/20' :
                        liveDifference > 0 ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-red-500/10 border border-red-500/20'
                    )}>
                      <span className={cn('text-sm font-medium', liveDifference === 0 ? 'text-green-600' : liveDifference > 0 ? 'text-blue-600' : 'text-red-600')}>
                        {liveDifference === 0 ? 'Sesuai' : liveDifference > 0 ? 'Kas Lebih' : 'Kas Kurang'}
                      </span>
                      <span className={cn('font-bold text-lg', liveDifference === 0 ? 'text-green-600' : liveDifference > 0 ? 'text-blue-600' : 'text-red-600')}>
                        {formatCurrency(Math.abs(liveDifference))}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-slate-600 text-xs font-medium">Catatan (opsional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Misal: selisih karena kembalian kurang..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all"
                    />
                  </div>
                </>
              ) : null}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 text-sm transition-all active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmClose}
                disabled={isSubmitting || isFetching || !summary || pendingForShift > 0}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-red-500/20"
              >
                {isSubmitting ? 'Menutup Kasir...' : pendingForShift > 0 ? 'Sinkronkan Dulu' : 'Konfirmasi Tutup Kasir'}
              </button>
            </div>
          </>
        ) : (
          <>
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
              <ShiftReportView
                ref={receiptRef}
                storeName={settings.store_name}
                cashierName={currentShift.cashier_name ?? '-'}
                openedAt={currentShift.opened_at}
                closedAt={new Date().toISOString()}
                openingCash={currentShift.opening_cash}
                totalOrders={closedResult.totalOrders}
                cashTotal={closedResult.cashTotal}
                qrisTotal={closedResult.qrisTotal}
                transferTotal={closedResult.transferTotal}
                grandTotal={closedResult.grandTotal}
                expectedCash={closedResult.expectedCash}
                closingCash={closedResult.closingCash}
                difference={closedResult.difference}
                notes={notes}
              />
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-800 hover:border-slate-300 transition-all active:scale-95 text-sm"
              >
                <Printer size={16} />
                <span>Cetak</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
              >
                Selesai
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between text-sm', bold ? 'font-bold text-slate-800' : 'text-slate-600')}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
