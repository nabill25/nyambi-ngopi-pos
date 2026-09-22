import { TrendingUp, ShoppingBag, Receipt, Package, Wallet, PiggyBank } from 'lucide-react';
import { SalesReport } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/utils';

interface SalesSummaryProps {
  summary: SalesReport | null;
  isLoading: boolean;
}

export function SalesSummary({ summary, isLoading }: SalesSummaryProps) {
  const isProfit = (summary?.total_profit ?? 0) >= 0;

  const cards = [
    {
      label: 'Total Pendapatan',
      value: summary ? formatCurrency(summary.total_revenue) : '-',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-emerald-400/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Jumlah Transaksi',
      value: summary ? formatNumber(summary.total_orders) : '-',
      icon: Receipt,
      color: 'from-blue-500/20 to-blue-400/10',
      border: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-400',
    },
    {
      label: 'Rata-rata Transaksi',
      value: summary ? formatCurrency(summary.average_order_value) : '-',
      icon: ShoppingBag,
      color: 'from-purple-500/20 to-purple-400/10',
      border: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      textColor: 'text-purple-400',
    },
    {
      label: 'Item Terjual',
      value: summary ? formatNumber(summary.total_items_sold) : '-',
      icon: Package,
      color: 'from-green-500/20 to-green-400/10',
      border: 'border-green-500/20',
      iconColor: 'text-green-400',
      textColor: 'text-green-400',
    },
    {
      label: 'Total Modal (HPP)',
      value: summary ? formatCurrency(summary.total_cost) : '-',
      icon: Wallet,
      color: 'from-slate-500/10 to-slate-400/5',
      border: 'border-slate-300/40',
      iconColor: 'text-slate-500',
      textColor: 'text-slate-600',
    },
    {
      label: `Estimasi Laba${summary ? ` (${summary.profit_margin_percent}%)` : ''}`,
      value: summary ? formatCurrency(summary.total_profit) : '-',
      icon: PiggyBank,
      color: isProfit ? 'from-emerald-500/20 to-emerald-400/10' : 'from-red-500/20 to-red-400/10',
      border: isProfit ? 'border-emerald-500/20' : 'border-red-500/20',
      iconColor: isProfit ? 'text-emerald-600' : 'text-red-500',
      textColor: isProfit ? 'text-emerald-600' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-4 space-y-3`}
        >
          <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center ${card.iconColor}`}>
            <card.icon size={18} />
          </div>
          {isLoading ? (
            <div className="space-y-1">
              <div className="h-6 w-24 bg-slate-50 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white rounded animate-pulse" />
            </div>
          ) : (
            <div>
              <p className={`text-lg font-bold ${card.textColor}`}>{card.value}</p>
              <p className="text-slate-500 text-xs">{card.label}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
