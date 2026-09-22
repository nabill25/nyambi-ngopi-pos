import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useReports } from '../hooks/useReports';
import { SalesSummary } from '../components/reports/SalesSummary';
import { SalesChart } from '../components/reports/SalesChart';
import { TopProducts } from '../components/reports/TopProducts';
import { PaymentBreakdownChart } from '../components/reports/PaymentBreakdown';
import { getDateRange, cn } from '../lib/utils';
import { DateRange } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'custom', label: 'Kustom' },
];

export function ReportsPage() {
  const { isLoading, summary, dailySales, topProducts, paymentBreakdown, rawOrders, fetchReport, exportPDF } = useReports();
  const [selectedRange, setSelectedRange] = useState<DateRange>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getCurrentRange = useCallback((): { start: Date; end: Date } | null => {
    if (selectedRange === 'custom') {
      if (!customStart || !customEnd) return null;
      return { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T23:59:59`) };
    }
    return getDateRange(selectedRange);
  }, [selectedRange, customStart, customEnd]);

  useEffect(() => {
    const range = getCurrentRange();
    if (range) fetchReport(range.start, range.end);

    const channel = supabase
      .channel('realtime_reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          const r = getCurrentRange();
          if (r) fetchReport(r.start, r.end);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getCurrentRange, fetchReport]);

  return (
    <div className="p-4 lg:p-6 space-y-5 h-full overflow-y-auto" style={{ background: 'transparent' }}>
      {/* Header / Date range */}
      <div className="flex flex-wrap items-center gap-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex p-1 rounded-2xl relative w-fit" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRange(r.value)}
              className={cn(
                'relative px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95',
                selectedRange === r.value ? 'text-white' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {selectedRange === r.value && (
                <motion.div
                  layoutId="activeReportRangeTab"
                  className="absolute inset-0 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                  style={{ background: 'linear-gradient(135deg,#1f9c56,#45b975)', boxShadow: '0 4px 16px rgba(31,156,86,0.35)' }}
                />
              )}
              <span className="relative z-10">{r.label}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence>
        {selectedRange === 'custom' && (
          <motion.div initial={{ opacity: 0, scale: 0.9, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -10 }} className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd || undefined}
              className="glass-input rounded-2xl px-3 py-2 text-sm text-slate-800"
            />
            <span className="text-slate-400 text-sm">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart || undefined}
              className="glass-input rounded-2xl px-3 py-2 text-sm text-slate-800"
            />
          </motion.div>
        )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 ml-auto">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-medium mr-2">
            <Activity size={14} className="animate-pulse" />
            <span className="hidden sm:inline">Live</span>
          </div>
          <button
            onClick={() => {
              const range = getCurrentRange();
              if (range) fetchReport(range.start, range.end);
            }}
            className="glass-btn flex items-center gap-2 px-4 py-2 rounded-2xl text-slate-600 hover:text-slate-800 text-sm transition-all active:scale-95"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              const range = DATE_RANGES.find(r => r.value === selectedRange)?.label || selectedRange;
              const rangeLabel = selectedRange === 'custom' ? `${customStart} - ${customEnd}` : range;
              exportPDF(rawOrders, rangeLabel);
            }}
            className="glass-btn flex items-center gap-2 px-4 py-2 rounded-2xl text-slate-600 hover:text-emerald-700 text-sm transition-all active:scale-95 group"
          >
            <Download size={14} className="group-hover:text-emerald-500 transition-colors" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SalesSummary summary={summary} isLoading={isLoading} />
      </motion.div>

      {/* Charts row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart data={dailySales} isLoading={isLoading} />
        </div>
        <div>
          <PaymentBreakdownChart data={paymentBreakdown} isLoading={isLoading} />
        </div>
      </motion.div>

      {/* Top products */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <TopProducts data={topProducts} isLoading={isLoading} />
      </motion.div>
    </div>
  );
}
