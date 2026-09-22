import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { DailySales } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface SalesChartProps {
  data: DailySales[];
  isLoading: boolean;
}

type ChartType = 'bar' | 'area';

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const rawDate = payload[0].payload.date;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl">
        <p className="text-slate-500 text-xs mb-1">
          {rawDate ? format(parseISO(rawDate), 'EEEE, dd MMM', { locale: localeId }) : ''}
        </p>
        <p className="text-emerald-400 font-bold text-sm">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function SalesChart({ data, isLoading }: SalesChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');

  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'dd/MM'),
  }));

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 font-semibold text-sm">Grafik Penjualan</h3>
        <div className="flex gap-1">
          {(['bar', 'area'] as ChartType[]).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize',
                chartType === type ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              )}
            >
              {type === 'bar' ? 'Batang' : 'Area'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-52 bg-white rounded-xl animate-pulse" />
      ) : data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
          Tidak ada data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          {chartType === 'bar' ? (
            <BarChart data={formatted} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v >= 1000 ? `${v / 1000}k` : v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="total" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={formatted} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v >= 1000 ? `${v / 1000}k` : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" stroke="#F59E0B" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
