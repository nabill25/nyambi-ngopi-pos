import { useState } from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useShiftStore } from '../../store/shiftStore';

export function OpenShiftModal() {
  const { profile, user } = useAuthStore();
  const { openShift } = useShiftStore();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? parseInt(num, 10).toLocaleString('id-ID') : '';
  };

  const handleOpen = async () => {
    const cashierId = profile?.id ?? user?.id;
    if (!cashierId) { setError('Sesi tidak valid, silakan login ulang'); return; }

    setIsLoading(true);
    setError(null);
    try {
      const openingCash = parseInt(amount.replace(/\D/g, ''), 10) || 0;
      await openShift(cashierId, profile?.full_name ?? 'Kasir', openingCash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka kasir');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-xl animate-scaleIn text-center">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet size={22} className="text-emerald-600" />
        </div>
        <h2 className="text-slate-800 font-bold text-base mb-1">Buka Kasir</h2>
        <p className="text-slate-500 text-sm mb-5">
          Masukkan jumlah kas awal di laci sebelum mulai berjualan.
        </p>

        <div className="text-left space-y-1.5 mb-4">
          <label className="text-slate-600 text-xs font-medium">Kas Awal (Rp)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatInput(e.target.value))}
              placeholder="0"
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm mb-4 animate-fadeIn text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleOpen}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
        >
          <span>{isLoading ? 'Membuka...' : 'Buka Kasir & Mulai Jualan'}</span>
          {!isLoading && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
