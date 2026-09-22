import { useState, useEffect } from 'react';
import { X, SplitSquareHorizontal, Plus, Minus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onConfirm: (payNowItems: CartItem[], holdItems: CartItem[]) => void;
}

export function SplitBillModal({ isOpen, onClose, items, onConfirm }: SplitBillModalProps) {
  // Mapping of CartItem ID to quantity selected to pay NOW
  const [payNowQtys, setPayNowQtys] = useState<Record<string, number>>({});

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      items.forEach((item) => {
        initial[item.id] = 0; // Default: nothing selected to pay now
      });
      setPayNowQtys(initial);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const updateQty = (id: string, delta: number, max: number) => {
    setPayNowQtys((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const selectAll = () => {
    const all: Record<string, number> = {};
    items.forEach((item) => {
      all[item.id] = item.quantity;
    });
    setPayNowQtys(all);
  };

  const clearAll = () => {
    const all: Record<string, number> = {};
    items.forEach((item) => {
      all[item.id] = 0;
    });
    setPayNowQtys(all);
  };

  const handleConfirm = () => {
    const payNowItems: CartItem[] = [];
    const holdItems: CartItem[] = [];

    items.forEach((item) => {
      const qtyPayNow = payNowQtys[item.id] || 0;
      const qtyHold = item.quantity - qtyPayNow;

      // Helper to recalculate subtotal based on new quantity
      const recalculateItem = (original: CartItem, newQty: number): CartItem => {
        // Find modifier total
        const modTotal = (original.selectedModifiers ?? []).reduce((sum, mod) => sum + mod.price_delta, 0);
        const unitPrice = original.product.price + modTotal;
        const totalBeforeDiscount = unitPrice * newQty;
        
        let finalSubtotal = totalBeforeDiscount;
        if (original.discount_percent > 0) {
          finalSubtotal = totalBeforeDiscount - (totalBeforeDiscount * (original.discount_percent / 100));
        } else if (original.discount_amount > 0) {
          // If flat discount is per item, we multiply it. Or if it's total line discount, we distribute it?
          // Usually discount_amount is per item or total? In Moka it's per line. Let's apply proportionally or flat.
          // For simplicity, assume discount_amount in CartItem is TOTAL for that row.
          const propDiscount = (original.discount_amount / original.quantity) * newQty;
          finalSubtotal = totalBeforeDiscount - propDiscount;
        }

        return {
          ...original,
          quantity: newQty,
          subtotal: Math.max(0, finalSubtotal),
          // distribute flat discount proportionally
          discount_amount: original.discount_amount > 0 ? (original.discount_amount / original.quantity) * newQty : 0
        };
      };

      if (qtyPayNow > 0) {
        payNowItems.push(recalculateItem(item, qtyPayNow));
      }
      if (qtyHold > 0) {
        holdItems.push(recalculateItem(item, qtyHold));
      }
    });

    onConfirm(payNowItems, holdItems);
  };

  const hasPayNowItems = Object.values(payNowQtys).some((q) => q > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            onClick={onClose} 
          />

          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="relative w-full sm:max-w-md bg-slate-50 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-100">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                <SplitSquareHorizontal size={20} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-800 text-base">Pisah Nota (Split Bill)</h2>
                <p className="text-slate-500 text-xs">Pilih item untuk dibayar sekarang</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex justify-between items-center px-1 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Pesanan</span>
                <div className="space-x-2">
                  <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors">Reset</button>
                  <button onClick={selectAll} className="text-xs text-emerald-500 hover:text-emerald-600 font-medium transition-colors">Pilih Semua</button>
                </div>
              </div>

              {items.map((item) => {
                const qtySelected = payNowQtys[item.id] || 0;
                const isAllSelected = qtySelected === item.quantity;
                
                return (
                  <div key={item.id} className={cn(
                    "bg-white p-3 rounded-xl border transition-all",
                    qtySelected > 0 ? "border-emerald-500/50 shadow-sm" : "border-slate-100 opacity-70"
                  )}>
                    <div className="flex justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm leading-tight">{item.product.name}</p>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {item.selectedModifiers.map(m => m.name).join(', ')}
                          </p>
                        )}
                        <p className="text-xs font-medium text-emerald-500 mt-1">
                          {formatCurrency(item.product.price)} / item
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between">
                        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full mb-2">
                          Total Qty: {item.quantity}
                        </span>
                        
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                          <button 
                            onClick={() => updateQty(item.id, -1, item.quantity)}
                            disabled={qtySelected === 0}
                            className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 active:bg-slate-100 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-slate-800">
                            {qtySelected}
                          </span>
                          <button 
                            onClick={() => updateQty(item.id, 1, item.quantity)}
                            disabled={isAllSelected}
                            className="w-6 h-6 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-200 disabled:opacity-30 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 active:bg-emerald-100 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary & Action */}
            <div className="bg-white p-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4 px-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Item Dibayar Sekarang</p>
                  <p className="text-lg font-bold text-emerald-500">
                    {Object.values(payNowQtys).reduce((sum, q) => sum + q, 0)} <span className="text-sm font-normal text-slate-500">/ {items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500">Item Ditahan</p>
                  <p className="text-base font-bold text-slate-700">
                    {items.reduce((sum, item) => sum + item.quantity, 0) - Object.values(payNowQtys).reduce((sum, q) => sum + q, 0)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!hasPayNowItems}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-base transition-all",
                  hasPayNowItems
                    ? "bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                <span>Proses Pemisahan</span>
                <ArrowRight size={18} />
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                Item yang tidak dipilih otomatis masuk ke "Pesanan Ditahan"
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
