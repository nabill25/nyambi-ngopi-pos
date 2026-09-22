import { Banknote, Smartphone, Building2 } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { cn } from '../../lib/utils';

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
  { method: 'cash', label: 'Tunai', icon: Banknote, desc: 'Bayar dengan uang tunai' },
  { method: 'qris', label: 'QRIS', icon: Smartphone, desc: 'Scan QR Code' },
  { method: 'transfer', label: 'Transfer', icon: Building2, desc: 'Transfer bank / e-wallet' },
];

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">Metode Pembayaran</p>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_OPTIONS.map(({ method, label, icon: Icon, desc }) => (
          <button
            key={method}
            onClick={() => onSelect(method)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200 active:scale-95',
              selectedMethod === method
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            <Icon size={20} />
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-xs opacity-60 hidden sm:block">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
