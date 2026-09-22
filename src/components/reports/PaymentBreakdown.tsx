import { PaymentBreakdown } from '../../types';
import { formatCurrency, formatNumber, getPaymentMethodLabel } from '../../lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface PaymentBreakdownChartProps {
  data: PaymentBreakdown[];
  isLoading: boolean;
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981'];
const METHOD_COLORS: Record<string, string> = {
  cash: '#F59E0B',
  qris: '#3B82F6',
  transfer: '#10B981',
};

export function PaymentBreakdownChart({ data, isLoading }: PaymentBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
      <h3 className="text-slate-800 font-semibold text-sm">Metode Pembayaran</h3>

      {isLoading ? (
        <div className="h-40 bg-white rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Tidak ada data</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="total"
              >
                {data.map((entry, idx) => (
                  <Cell key={entry.payment_method} fill={METHOD_COLORS[entry.payment_method] ?? COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Total']}
                contentStyle={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#1e293b' }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            {data.map((item) => {
              const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
              const color = METHOD_COLORS[item.payment_method] ?? '#F59E0B';
              return (
                <div key={item.payment_method} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-slate-700 text-xs flex-1">{getPaymentMethodLabel(item.payment_method)}</span>
                  <span className="text-slate-500 text-xs">{formatNumber(item.count)} transaksi</span>
                  <span className="text-slate-800 text-xs font-semibold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
