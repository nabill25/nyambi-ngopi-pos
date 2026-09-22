import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { formatCurrency, playSuccessSound } from '../../lib/utils';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { toast } from 'sonner';

interface QrisPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  amount: number;
}

export function QrisPaymentModal({ isOpen, onClose, onSuccess, amount }: QrisPaymentModalProps) {
  const isOnline = useOnlineStatus();
  const [status, setStatus] = useState<'waiting' | 'success'>('waiting');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (isOpen) {
      setStatus('waiting');
      setTimeLeft(300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && status === 'waiting') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            toast.error('Waktu pembayaran QRIS habis');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, status, onClose]);

  const handleSimulateSuccess = async () => {
    setStatus('success');
    playSuccessSound();
    
    // Wait a bit to show success animation before calling onSuccess
    setTimeout(async () => {
      try {
        await onSuccess();
      } catch (err) {
        toast.error('Gagal memproses pesanan setelah pembayaran');
        setStatus('waiting');
      }
    }, 1500);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={status === 'waiting' ? onClose : undefined}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <QrCode className="text-emerald-500" size={20} />
                <h2 className="text-base font-bold text-slate-800">Pembayaran QRIS</h2>
              </div>
              {status === 'waiting' && (
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="p-6 flex flex-col items-center">
              {status === 'waiting' ? (
                <>
                  <p className="text-slate-500 text-sm mb-4 text-center">
                    Minta pelanggan scan QR Code di bawah ini menggunakan aplikasi e-Wallet atau m-Banking.
                  </p>

                  <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-sm relative">
                    {isOnline ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NyambiNgopi-Rp${amount}`} 
                        alt="QRIS" 
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-50 text-slate-400 text-xs text-center p-4">
                        QR Code butuh koneksi internet
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Tagihan</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(amount)}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Menunggu Pembayaran... {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </div>

                  <button
                    onClick={handleSimulateSuccess}
                    className="mt-8 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    (Mode Sandbox) Simulasikan Sukses
                  </button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-emerald-500" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Pembayaran Berhasil!</h3>
                  <p className="text-slate-500 text-sm mt-2 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    Terverifikasi otomatis
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
