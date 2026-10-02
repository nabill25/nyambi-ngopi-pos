import { ArrowDownRight, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { ShiftCashFlow } from '../../types';
import { formatCurrency, formatDateTime, formatNumber } from '../../lib/utils';
import { cashFlowLabel } from '../../lib/shiftReport';
import { summarizeCashFlows } from '../../lib/reportAggregates';

interface CashFlowReportProps {
  flows: ShiftCashFlow[];
  cashierNames: Map<string, string>;
  isLoading: boolean;
}

// Kas keluar/masuk laci dari semua akun kasir pada periode laporan: total + keterangan, nominal, kasir, dan jam tiap entri
export function CashFlowReport({ flows, cashierNames, isLoading }: CashFlowReportProps) {
  const { cashIn, cashOut, countIn, countOut } = summarizeCashFlows(flows);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={16} className="text-emerald-400" />
        <h3 className="text-slate-800 font-semibold text-sm">Kas Keluar & Masuk Laci</h3>
      </div>

      {isLoading ? (
        <div className="h-24 bg-white rounded-xl animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
              <p className="text-red-600 text-base font-bold">{formatCurrency(cashOut)}</p>
              <p className="text-slate-500 text-xs">Kas Keluar ({formatNumber(countOut)} entri)</p>
            </div>
            <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-600 text-base font-bold">{formatCurrency(cashIn)}</p>
              <p className="text-slate-500 text-xs">Kas Masuk ({formatNumber(countIn)} entri)</p>
            </div>
          </div>

          {flows.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Tidak ada kas keluar/masuk pada periode ini</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {flows.map((flow) => {
                const isOut = flow.type === 'out';
                const cashierName = cashierNames.get(flow.cashier_id) ?? '-';
                return (
                  <div key={flow.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOut ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {isOut ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-medium break-words">{cashFlowLabel(flow)}</p>
                      <p className="text-slate-500 text-xs">{formatDateTime(flow.created_at)} · {cashierName}</p>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${isOut ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isOut ? '-' : '+'}{formatCurrency(flow.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
