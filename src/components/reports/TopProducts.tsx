import { TopProduct } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Trophy } from 'lucide-react';

interface TopProductsProps {
  data: TopProduct[];
  isLoading: boolean;
}

export function TopProducts({ data, isLoading }: TopProductsProps) {
  const max = data[0]?.total_quantity ?? 1;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-emerald-400" />
        <h3 className="text-slate-800 font-semibold text-sm">Produk Terlaris</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Tidak ada data</p>
      ) : (
        <div className="space-y-3">
          {data.map((product, idx) => {
            const pct = (product.total_quantity / max) * 100;
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={product.product_id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center">{medals[idx] ?? `${idx + 1}.`}</span>
                  <span className="flex-1 text-slate-800 text-xs font-medium truncate">{product.product_name}</span>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-slate-500 text-xs">{formatNumber(product.total_quantity)} pcs</span>
                    <span className="text-emerald-400 text-xs font-semibold min-w-20 text-right">{formatCurrency(product.total_revenue)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden ml-7">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
