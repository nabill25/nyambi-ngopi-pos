import { UserRound, UserX } from 'lucide-react';

interface PaymentCustomerSectionProps {
  customerId: string | null;
  customerName: string | null;
  onPick: () => void;
  onClear: () => void;
}

export function PaymentCustomerSection({ customerId, customerName, onPick, onClear }: PaymentCustomerSectionProps) {
  if (customerName) {
    return (
      <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <UserRound size={14} className="text-emerald-700" />
        </div>
        <span className="text-emerald-800 text-sm font-medium flex-1 truncate">
          {customerName} {!customerId && <span className="text-emerald-600/70 text-xs font-normal">(Bukan Member)</span>}
        </span>
        <button
          onClick={onClear}
          className="text-emerald-700 hover:text-red-500 transition-colors flex-shrink-0"
          title="Hapus pelanggan"
        >
          <UserX size={15} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onPick}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-400 transition-all text-sm active:scale-95"
    >
      <UserRound size={15} />
      <span>Pilih Pelanggan (opsional)</span>
    </button>
  );
}
