import { useState } from 'react';
import { X, Tag, Ticket } from 'lucide-react';
import { usePromotions, getAutoPromotions, validatePromoCode } from '../../hooks/usePromotions';
import { Promotion } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

interface PromoPickerModalProps {
  isOpen: boolean;
  subtotal: number;
  onClose: () => void;
  onApply: (promo: Promotion) => void;
}

function describeDiscount(promo: Promotion): string {
  return promo.discount_type === 'percent' ? `${promo.discount_value}%` : formatCurrency(promo.discount_value);
}

export function PromoPickerModal({ isOpen, subtotal, onClose, onApply }: PromoPickerModalProps) {
  const { promotions, isLoading } = usePromotions();
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const autoPromos = getAutoPromotions(promotions, subtotal);

  const handleApply = (promo: Promotion) => {
    onApply(promo);
    onClose();
  };

  const handleApplyCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    const promo = promotions.find((p) => (p.code ?? '').toUpperCase() === code);
    const validationError = validatePromoCode(promo, subtotal);
    if (validationError) { setError(validationError); return; }
    handleApply(promo!);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base flex-1">Promo & Voucher</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Code input */}
          <div className="space-y-1.5">
            <label className="text-slate-600 text-xs font-medium">Punya Kode Voucher?</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setError(null); }}
                placeholder="Masukkan kode"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCode()}
              />
              <button
                onClick={handleApplyCode}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
              >
                Pakai
              </button>
            </div>
            {error && <p className="text-red-500 text-xs animate-fadeIn">{error}</p>}
          </div>

          {/* Auto promos */}
          <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Promo Tersedia</p>
            {isLoading ? (
              <div className="h-16 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
            ) : autoPromos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <Tag size={28} className="mb-2 opacity-40" />
                <p className="text-xs">Tidak ada promo otomatis saat ini</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {autoPromos.map((promo) => (
                  <button
                    key={promo.id}
                    onClick={() => handleApply(promo)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.99]',
                      'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-500/10'
                    )}
                  >
                    <Ticket size={16} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 text-sm flex-1">{promo.name}</span>
                    <span className="text-emerald-600 text-xs font-bold flex-shrink-0">-{describeDiscount(promo)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
