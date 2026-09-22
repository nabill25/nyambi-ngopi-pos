import { useState, useMemo } from 'react';
import { ShoppingCart, Wallet, LogOut, PauseCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductGrid } from '../components/pos/ProductGrid';
import { CartPanel } from '../components/pos/CartPanel';
import { PaymentModal } from '../components/pos/PaymentModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { CategoryFilter } from '../components/pos/CategoryFilter';
import { SearchBar } from '../components/pos/SearchBar';
import { OpenShiftModal } from '../components/pos/OpenShiftModal';
import { CloseShiftModal } from '../components/pos/CloseShiftModal';
import { CashFlowModal } from '../components/pos/CashFlowModal';
import { HeldOrdersModal } from '../components/pos/HeldOrdersModal';
import { useCartStore } from '../store/cartStore';
import { useShiftStore } from '../store/shiftStore';
import { useHeldOrdersStore } from '../store/heldOrdersStore';
import { Order } from '../types';
import { cn, formatCurrency, formatTime } from '../lib/utils';

export function POSPage() {
  const { products, isLoading } = useProducts();
  const { categories } = useCategories();
  const { currentShift, isLoading: shiftLoading } = useShiftStore();
  const heldOrdersCount = useHeldOrdersStore((s) => s.heldOrders.length);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [showCashFlow, setShowCashFlow] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active) return false;
      if (selectedCategory && p.category_id !== selectedCategory) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedCategory, search]);

  const handlePaymentSuccess = (order: Order) => {
    setShowPayment(false);
    setLastOrder(order);
    setShowReceipt(true);
  };

  if (shiftLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(31,156,86,0.2)', borderTopColor: '#1f9c56' }} />
      </div>
    );
  }

  if (!currentShift) {
    return <OpenShiftModal />;
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: Products ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Shift status bar — glass pill bar */}
        <div
          className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
          style={{
            background: 'rgba(31,156,86,0.08)',
            borderBottom: '1px solid rgba(31,156,86,0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Wallet size={14} style={{ color: '#1f9c56', flexShrink: 0 }} />
          <p className="text-xs flex-1 min-w-0 truncate" style={{ color: '#0d4a26' }}>
            Kasir dibuka {formatTime(currentShift.opened_at)} · Kas awal {formatCurrency(currentShift.opening_cash)}
          </p>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Kelola Laci', icon: Wallet, onClick: () => setShowCashFlow(true) },
              { label: 'Tutup Kasir', icon: LogOut, onClick: () => setShowCloseShift(true) },
            ].map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 press"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: '#0d3d20',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon size={11} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div
          className="px-4 pt-3 pb-3 space-y-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.25)' }}
        >
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter
            categories={categories}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid products={filteredProducts} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Right: Cart (desktop) — Glass Panel ────────────── */}
      <div
        className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderLeft: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}
        >
          <h2 className="font-bold text-slate-800 text-sm">Pesanan</h2>
          <button
            onClick={() => setShowHeldOrders(true)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 press"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              color: '#2563eb',
            }}
          >
            <PauseCircle size={13} />
            <span>Ditahan</span>
            {heldOrdersCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: '#3b82f6', boxShadow: '0 2px 8px rgba(59,130,246,0.5)' }}
              >
                {heldOrdersCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CartPanel onCheckout={() => setShowPayment(true)} />
        </div>
      </div>

      {/* ── Mobile: Cart FAB ─────────────────────────────── */}
      <button
        onClick={() => setShowCartMobile(true)}
        className={cn(
          'lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation',
          itemCount === 0 && 'opacity-70'
        )}
        style={{
          background: 'linear-gradient(135deg,#1f9c56,#45b975)',
          boxShadow: '0 8px 32px rgba(31,156,86,0.55)',
          border: '1px solid rgba(69,185,117,0.4)',
        }}
      >
        <ShoppingCart size={22} className="text-white" />
        {itemCount > 0 && (
          <span
            key={itemCount}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center animate-scaleIn"
            style={{ background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}
          >
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      {/* ── Mobile: Cart Sheet ───────────────────────────── */}
      <AnimatePresence>
        {showCartMobile && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              onClick={() => setShowCartMobile(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden"
              style={{
                maxHeight: '88vh',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.5)',
                borderBottom: 'none',
              }}
            >
              {/* Sheet header */}
              <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {/* drag indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200" />
                <h2 className="font-bold text-slate-800 text-sm">Pesanan</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHeldOrders(true)}
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 touch-manipulation"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#2563eb' }}
                  >
                    <PauseCircle size={13} />
                    <span>Ditahan</span>
                    {heldOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                        {heldOrdersCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCartMobile(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 touch-manipulation"
                    style={{ background: 'rgba(0,0,0,0.05)' }}
                  >
                    Tutup
                  </button>
                </div>
              </div>
              {/* Cart content — scrollable */}
              <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                <CartPanel onCheckout={() => { setShowCartMobile(false); setShowPayment(true); }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modals ──────────────────────────────────────── */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />
      <ReceiptModal isOpen={showReceipt} order={lastOrder} onClose={() => setShowReceipt(false)} onNewOrder={() => setShowReceipt(false)} />
      <CloseShiftModal isOpen={showCloseShift} onClose={() => setShowCloseShift(false)} />
      <CashFlowModal isOpen={showCashFlow} onClose={() => setShowCashFlow(false)} />
      <HeldOrdersModal isOpen={showHeldOrders} onClose={() => setShowHeldOrders(false)} />
    </div>
  );
}
