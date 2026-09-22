import { Trash2, ShoppingCart, ChevronRight, Tag, PauseCircle, Ticket, SplitSquareHorizontal } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { useHeldOrdersStore } from '../../store/heldOrdersStore';
import { formatCurrency, cn } from '../../lib/utils';
import { CartItemRow } from './CartItemRow';
import { PromoPickerModal } from './PromoPickerModal';
import { SplitBillModal } from './SplitBillModal';
import { Promotion, CartItem } from '../../types';

interface CartPanelProps {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: CartPanelProps) {
  const {
    items,
    discountPercent,
    discountAmount,
    notes,
    promoName,
    getSubtotal,
    getTotalDiscount,
    getTotal,
    getItemCount,
    removeItem,
    updateQuantity,
    clearCart,
    setDiscount,
  } = useCartStore();
  const { heldOrders, holdOrder } = useHeldOrdersStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discInput, setDiscInput] = useState('');
  const [discType, setDiscType] = useState<'percent' | 'amount'>('percent');
  const [showHoldInput, setShowHoldInput] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');
  const [showPromoPicker, setShowPromoPicker] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);

  const handleApplyPromo = (promo: Promotion) => {
    if (promo.discount_type === 'percent') {
      setDiscount(Math.min(promo.discount_value, 100), 0, promo.code, promo.name);
    } else {
      setDiscount(0, promo.discount_value, promo.code, promo.name);
    }
  };

  const confirmHold = () => {
    const label = holdLabel.trim() || `Pesanan ${heldOrders.length + 1}`;
    holdOrder(label, items, discountPercent, discountAmount, notes);
    clearCart();
    setShowHoldInput(false);
    setHoldLabel('');
  };

  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const total = getTotal();
  const itemCount = getItemCount();

  const applyDiscount = () => {
    const val = parseFloat(discInput) || 0;
    if (discType === 'percent') {
      setDiscount(Math.min(val, 100), 0);
    } else {
      setDiscount(0, Math.max(0, val));
    }
    setShowDiscountInput(false);
    setDiscInput('');
  };

  const removeDiscount = () => {
    setDiscount(0, 0);
  };

  const handleSplitConfirm = (payNowItems: CartItem[], holdItems: CartItem[]) => {
    // Save held items to Hold Orders
    if (holdItems.length > 0) {
      const label = `Sisa Pesanan ${heldOrders.length + 1}`;
      // For simplicity, we don't copy the cart level discounts to the held order
      holdOrder(label, holdItems, 0, 0, notes);
    }
    
    // Update current cart with pay now items
    if (payNowItems.length > 0) {
      // Re-load the cart but keep current discounts
      useCartStore.getState().loadCart(payNowItems, discountPercent, discountAmount, notes);
    } else {
      clearCart();
    }
    setShowSplitBill(false);
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-slate-400 py-16 px-4"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <ShoppingCart size={52} className="mb-4 opacity-25" />
        </motion.div>
        <p className="text-sm font-medium text-slate-500">Keranjang kosong</p>
        <p className="text-xs mt-1 text-slate-400">Pilih menu untuk memulai</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 overflow-x-hidden">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -24, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.3 }}
            >
              <CartItemRow item={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary & actions */}
      <div className="border-t border-slate-100 px-4 py-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal ({itemCount} item)</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {/* Discount */}
        {(discountPercent > 0 || discountAmount > 0) ? (
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-green-400">{promoName ? `Promo: ${promoName}` : 'Diskon'}</span>
              <span className="text-slate-500 text-xs">
                {discountPercent > 0 ? `(${discountPercent}%)` : `(${formatCurrency(discountAmount)})`}
              </span>
              <button onClick={removeDiscount} className="text-slate-400 hover:text-red-400 transition-colors ml-1">
                <Trash2 size={12} />
              </button>
            </div>
            <span className="text-green-400">- {formatCurrency(totalDiscount)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <Tag size={12} />
              <span>Tambah diskon</span>
            </button>
            <button
              onClick={() => setShowPromoPicker(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <Ticket size={12} />
              <span>Pakai promo</span>
            </button>
          </div>
        )}

        {/* Discount input */}
        <AnimatePresence>
          {showDiscountInput && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="bg-white rounded-xl p-3 space-y-2"
            >
            <div className="flex gap-2">
              <button
                onClick={() => setDiscType('percent')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  discType === 'percent' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 hover:text-slate-800'
                )}
              >
                Persen (%)
              </button>
              <button
                onClick={() => setDiscType('amount')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  discType === 'amount' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 hover:text-slate-800'
                )}
              >
                Nominal (Rp)
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={discInput}
                onChange={(e) => setDiscInput(e.target.value)}
                placeholder={discType === 'percent' ? 'Misal: 10' : 'Misal: 5000'}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                autoFocus
              />
              <button
                onClick={applyDiscount}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-white text-xs font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Total */}
        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
          <span className="font-semibold text-slate-800">Total</span>
          <span className="text-xl font-bold text-emerald-400">{formatCurrency(total)}</span>
        </div>

        {/* Hold order input */}
        <AnimatePresence>
          {showHoldInput && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="bg-white rounded-xl p-3 space-y-2"
            >
            <input
              type="text"
              value={holdLabel}
              onChange={(e) => setHoldLabel(e.target.value)}
              placeholder={`Misal: Meja 3 (default: Pesanan ${heldOrders.length + 1})`}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && confirmHold()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowHoldInput(false); setHoldLabel(''); }}
                className="flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmHold}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-white text-xs font-medium transition-colors"
              >
                Tahan Pesanan
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setShowSplitBill(true)}
            title="Pisah Nota"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-emerald-500/40 hover:text-emerald-500 transition-all text-sm active:scale-95"
          >
            <SplitSquareHorizontal size={14} />
          </button>
          <button
            onClick={() => setShowHoldInput(true)}
            title="Tahan pesanan"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-blue-400/40 hover:text-blue-500 transition-all text-sm active:scale-95"
          >
            <PauseCircle size={14} />
          </button>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-red-500/40 hover:text-red-400 transition-all text-sm active:scale-95"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Batal</span>
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCheckout}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl"
          >
            <span>Bayar</span>
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>

      <PromoPickerModal
        isOpen={showPromoPicker}
        subtotal={subtotal}
        onClose={() => setShowPromoPicker(false)}
        onApply={handleApplyPromo}
      />

      <SplitBillModal
        isOpen={showSplitBill}
        onClose={() => setShowSplitBill(false)}
        items={items}
        onConfirm={handleSplitConfirm}
      />
    </div>
  );
}
