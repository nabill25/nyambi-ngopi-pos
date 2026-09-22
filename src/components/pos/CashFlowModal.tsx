import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useShiftStore } from '../../store/shiftStore';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashFlowModal({ isOpen, onClose }: CashFlowModalProps) {
  const { addCashFlow } = useShiftStore();
  const [type, setType] = useState<'in' | 'out'>('out');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setType('out');
      setAmount('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Masukkan nominal yang valid');
      return;
    }
    if (!description.trim()) {
      toast.error('Masukkan keterangan');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCashFlow(type, parsedAmount, description);
      toast.success(type === 'in' ? 'Kas Masuk berhasil dicatat' : 'Kas Keluar berhasil dicatat');
      onClose();
    } catch (error) {
      toast.error('Gagal mencatat kas');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="glass-modal relative w-full max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <h2 className="text-lg font-bold text-slate-800">Kelola Laci Kasir</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-all press"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('in')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    type === 'in'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-2 ${type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>
                    <ArrowDownRight size={24} />
                  </div>
                  <span className="font-semibold">Kas Masuk</span>
                  <span className="text-xs opacity-80 mt-1 text-center">Uang kembalian, titipan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('out')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    type === 'out'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-2 ${type === 'out' ? 'bg-red-100 text-red-600' : 'bg-slate-100'}`}>
                    <ArrowUpRight size={24} />
                  </div>
                  <span className="font-semibold">Kas Keluar</span>
                  <span className="text-xs opacity-80 mt-1 text-center">Beli es, gas, pengeluaran</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Beli es batu kristal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-emerald-glow w-full text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-40"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
