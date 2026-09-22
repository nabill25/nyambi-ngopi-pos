import { Gem } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

interface LoyaltyPointsSectionProps {
  availablePoints: number;
  redeemRate: number;
  maxRedeemable: number;
  pointsToRedeem: number;
  pointsToEarn: number;
  onChange: (points: number) => void;
}

export function LoyaltyPointsSection({
  availablePoints,
  redeemRate,
  maxRedeemable,
  pointsToRedeem,
  pointsToEarn,
  onChange,
}: LoyaltyPointsSectionProps) {
  const handleInput = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    onChange(Math.min(num, maxRedeemable));
  };

  return (
    <div className="bg-white border border-amber-200 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-700">
          <Gem size={14} />
          <span className="text-xs font-semibold">Poin Loyalitas</span>
        </div>
        <span className="text-slate-500 text-xs">
          Saldo: <strong className="text-slate-700">{availablePoints.toLocaleString('id-ID')} poin</strong>
        </span>
      </div>

      {maxRedeemable > 0 ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={pointsToRedeem ? pointsToRedeem.toLocaleString('id-ID') : ''}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="0"
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <button
            onClick={() => onChange(maxRedeemable)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95',
              pointsToRedeem === maxRedeemable
                ? 'bg-amber-500 text-white'
                : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
            )}
          >
            Maks
          </button>
          {pointsToRedeem > 0 && (
            <button onClick={() => onChange(0)} className="text-slate-400 hover:text-red-500 text-xs transition-colors">
              Batal
            </button>
          )}
        </div>
      ) : (
        <p className="text-slate-400 text-xs">Belum cukup poin untuk dipakai</p>
      )}

      {pointsToRedeem > 0 && (
        <p className="text-amber-700 text-xs font-medium">
          Potongan poin: -{formatCurrency(pointsToRedeem * redeemRate)}
        </p>
      )}
      {pointsToEarn > 0 && (
        <p className="text-slate-500 text-xs">+{pointsToEarn.toLocaleString('id-ID')} poin akan didapat dari transaksi ini</p>
      )}
    </div>
  );
}
