import { useState } from 'react';
import { X, PauseCircle, Trash2, PlayCircle } from 'lucide-react';
import { useHeldOrdersStore, HeldOrder } from '../../store/heldOrdersStore';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency, formatTime, cn } from '../../lib/utils';

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeldOrdersModal({ isOpen, onClose }: HeldOrdersModalProps) {
  const { heldOrders, removeHeldOrder } = useHeldOrdersStore();
  const { items, loadCart } = useCartStore();
  const [confirmResumeId, setConfirmResumeId] = useState<string | null>(null);

  const orderTotal = (order: HeldOrder) => order.items.reduce((s, i) => s + i.subtotal, 0);

  const doResume = (order: HeldOrder) => {
    loadCart(order.items, order.discountPercent, order.discountAmount, order.notes);
    removeHeldOrder(order.id);
    setConfirmResumeId(null);
    onClose();
  };

  const handleResumeClick = (order: HeldOrder) => {
    if (items.length > 0) {
      setConfirmResumeId(order.id);
    } else {
      doResume(order);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base flex-1">Pesanan Ditahan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-2">
          {heldOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <PauseCircle size={40} className="mb-3 opacity-40" />
              <p className="text-sm">Tidak ada pesanan yang ditahan</p>
            </div>
          ) : (
            heldOrders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-100 rounded-xl p-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-semibold truncate">{order.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {order.items.length} item · {formatTime(order.heldAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-emerald-600 font-bold text-sm">{formatCurrency(orderTotal(order))}</p>
                  </div>
                  <button
                    onClick={() => removeHeldOrder(order.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-90 flex-shrink-0"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {confirmResumeId === order.id ? (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 animate-fadeIn">
                    <p className="text-red-500 text-xs flex-1">Keranjang saat ini akan diganti.</p>
                    <button
                      onClick={() => setConfirmResumeId(null)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => doResume(order)}
                      className="px-2.5 py-1.5 bg-red-500 hover:bg-red-400 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      Ya, Timpa
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleResumeClick(order)}
                    className={cn(
                      'mt-2.5 pt-2.5 border-t border-slate-100 w-full flex items-center justify-center gap-1.5',
                      'text-emerald-600 hover:text-emerald-700 text-xs font-semibold transition-all active:scale-95'
                    )}
                  >
                    <PlayCircle size={14} />
                    <span>Lanjutkan Pesanan</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
