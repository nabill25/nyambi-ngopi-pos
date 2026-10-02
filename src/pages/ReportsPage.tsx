import { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, Activity } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { useCashiers } from '../hooks/useCashiers';
import { useDateRangeFilter } from '../hooks/useDateRangeFilter';
import { useShiftActivity } from '../hooks/useShiftActivity';
import { useTableChanges } from '../hooks/useTableChanges';
import { SalesSummary } from '../components/reports/SalesSummary';
import { SalesChart } from '../components/reports/SalesChart';
import { TopProducts } from '../components/reports/TopProducts';
import { PaymentBreakdownChart } from '../components/reports/PaymentBreakdown';
import { DateRangeFilter, DATE_RANGES } from '../components/reports/DateRangeFilter';
import { CashierFilter } from '../components/reports/CashierFilter';
import { CashierSalesReport } from '../components/reports/CashierSalesReport';
import { ShiftReportList } from '../components/reports/ShiftReportList';
import { CashFlowReport } from '../components/reports/CashFlowReport';
import { motion } from 'framer-motion';

export function ReportsPage() {
  const { isLoading, error: reportError, summary, dailySales, topProducts, paymentBreakdown, cashierSales, rawOrders, fetchReport, exportPDF } = useReports();
  const { selectedRange, setSelectedRange, customStart, setCustomStart, customEnd, setCustomEnd, getCurrentRange } = useDateRangeFilter('today');
  const [cashierId, setCashierId] = useState<string | null>(null);
  const { cashiers, nameById } = useCashiers();
  const activity = useShiftActivity(getCurrentRange, cashierId);

  const refreshReport = useCallback(() => {
    const range = getCurrentRange();
    if (range) void fetchReport(range.start, range.end, cashierId);
  }, [getCurrentRange, fetchReport, cashierId]);

  useEffect(() => {
    refreshReport();
  }, [refreshReport]);

  // Transaksi baru dari akun kasir mana pun langsung masuk ke laporan ini
  useTableChanges(['orders'], refreshReport);

  const handleExportPDF = () => {
    const rangeLabel = selectedRange === 'custom'
      ? `${customStart} - ${customEnd}`
      : DATE_RANGES.find((r) => r.value === selectedRange)?.label || selectedRange;
    const cashierName = cashierId ? nameById.get(cashierId) : null;
    exportPDF(rawOrders, cashierName ? `${rangeLabel} · ${cashierName}` : rangeLabel);
  };

  const errorMessage = reportError ?? activity.error;

  return (
    <div className="p-4 lg:p-6 space-y-5 h-full overflow-y-auto" style={{ background: 'transparent' }}>
      {/* Header / Date range */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeFilter
          value={selectedRange}
          onChange={setSelectedRange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          layoutId="activeReportRangeTab"
        />
        <CashierFilter cashiers={cashiers} value={cashierId} onChange={setCashierId} />

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 ml-auto">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-medium mr-2">
            <Activity size={14} className="animate-pulse" />
            <span className="hidden sm:inline">Live</span>
          </div>
          <button
            onClick={() => {
              refreshReport();
              void activity.refetch();
            }}
            className="glass-btn flex items-center gap-2 px-4 py-2 rounded-2xl text-slate-600 hover:text-slate-800 text-sm transition-all active:scale-95"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="glass-btn flex items-center gap-2 px-4 py-2 rounded-2xl text-slate-600 hover:text-emerald-700 text-sm transition-all active:scale-95 group"
          >
            <Download size={14} className="group-hover:text-emerald-500 transition-colors" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </motion.div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500">{errorMessage}</div>
      )}

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

      {/* Data semua akun kasir: penjualan, tutup kasir (shift), dan kas laci */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <CashierSalesReport data={cashierSales} isLoading={isLoading} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <ShiftReportList shifts={activity.shifts} orders={rawOrders} cashierNames={nameById} isLoading={activity.isLoading} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <CashFlowReport flows={activity.cashFlows} cashierNames={nameById} isLoading={activity.isLoading} />
      </motion.div>
    </div>
  );
}
