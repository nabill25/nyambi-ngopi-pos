import { WifiOff } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface PaymentSummaryProps {
  subtotal: number;
  totalDiscount: number;
  promoName: string | null;
  taxEnabled: boolean;
  taxAmount: number;
  taxLabel: string;
  taxPercent: number;
  pointsDiscount: number;
  pointsUsed: number;
  grandTotal: number;
  isOnline: boolean;
}

export function PaymentSummary({
  subtotal,
  totalDiscount,
  promoName,
  taxEnabled,
  taxAmount,
  taxLabel,
  taxPercent,
  pointsDiscount,
  pointsUsed,
  grandTotal,
  isOnline,
}: PaymentSummaryProps) {
  return (
    <div className="bg-white rounded-xl p-4 space-y-2">
      {!isOnline && (
        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-500/10 rounded-lg px-2.5 py-1.5 text-xs font-medium mb-1">
          <WifiOff size={12} />
          <span>Offline — transaksi disimpan &amp; disinkron otomatis nanti</span>
        </div>
      )}
      <div className="flex justify-between text-sm text-slate-600">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {totalDiscount > 0 && (
        <div className="flex justify-between text-sm text-green-400">
          <span>{promoName ? `Promo: ${promoName}` : 'Diskon'}</span>
          <span>- {formatCurrency(totalDiscount)}</span>
        </div>
      )}
      {taxEnabled && taxAmount > 0 && (
        <div className="flex justify-between text-sm text-slate-600">
          <span>{taxLabel} ({taxPercent}%)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
      )}
      {pointsDiscount > 0 && (
        <div className="flex justify-between text-sm text-amber-600">
          <span>Poin ({pointsUsed})</span>
          <span>- {formatCurrency(pointsDiscount)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200">
        <span>Total</span>
        <span className="text-emerald-400 text-lg">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
