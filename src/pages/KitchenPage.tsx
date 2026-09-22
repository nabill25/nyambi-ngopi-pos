import { useMemo } from 'react';
import { Clock, ChefHat, CheckCircle2, ChevronRight } from 'lucide-react';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { Order, KitchenStatus } from '../types';
import { formatTime } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function KitchenPage() {
  const { orders, isLoading, error, updateKitchenStatus } = useKitchenOrders();

  const pendingOrders = useMemo(() => orders.filter(o => o.kitchen_status === 'pending'), [orders]);
  const preparingOrders = useMemo(() => orders.filter(o => o.kitchen_status === 'preparing'), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => o.kitchen_status === 'ready'), [orders]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-md text-center">
          <p className="font-bold mb-2">Terjadi Kesalahan</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="px-6 py-5 flex justify-between items-center z-10 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight drop-shadow-sm">Layar Dapur (KDS)</h1>
          <p className="text-slate-600 text-sm font-medium">Pesanan masuk otomatis tanpa perlu direfresh.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex gap-4">
          <div className="text-center px-5 py-2 glass-pill">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Antrean</p>
            <p className="text-xl font-black text-slate-800 leading-tight">{pendingOrders.length}</p>
          </div>
          <div className="text-center px-5 py-2 rounded-2xl" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Dimasak</p>
            <p className="text-xl font-black text-amber-700 leading-tight">{preparingOrders.length}</p>
          </div>
        </motion.div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max">
          
          {/* Column 1: Menunggu Dibuat */}
          <div className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-bold text-slate-700 flex items-center gap-2 drop-shadow-sm">
                <Clock size={18} className="text-slate-500" /> Menunggu
              </h2>
              <span className="glass-pill px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">{pendingOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-12 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {pendingOrders.map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i} onAdvance={() => updateKitchenStatus(order.id, 'preparing')} />
                ))}
              </AnimatePresence>
              {pendingOrders.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-slate-400 rounded-3xl" style={{ border: '2px dashed rgba(0,0,0,0.1)' }}>Kosong</motion.div>
              )}
            </div>
          </div>

          {/* Column 2: Sedang Dibuat */}
          <div className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-bold text-amber-800 flex items-center gap-2 drop-shadow-sm">
                <ChefHat size={18} className="text-amber-600" /> Sedang Dibuat
              </h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-amber-800 shadow-sm" style={{ background: 'rgba(245,158,11,0.2)' }}>{preparingOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-12 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {preparingOrders.map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i} onAdvance={() => updateKitchenStatus(order.id, 'ready')} />
                ))}
              </AnimatePresence>
              {preparingOrders.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-amber-500/60 rounded-3xl" style={{ border: '2px dashed rgba(245,158,11,0.2)' }}>Kosong</motion.div>
              )}
            </div>
          </div>

          {/* Column 3: Siap Disajikan */}
          <div className="w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="font-bold text-emerald-800 flex items-center gap-2 drop-shadow-sm">
                <CheckCircle2 size={18} className="text-emerald-600" /> Siap Disajikan
              </h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-800 shadow-sm" style={{ background: 'rgba(16,185,129,0.2)' }}>{readyOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-12 scrollbar-hide">
              <AnimatePresence mode="popLayout">
                {readyOrders.map((order, i) => (
                  <OrderCard key={order.id} order={order} index={i} onAdvance={() => updateKitchenStatus(order.id, 'delivered')} />
                ))}
              </AnimatePresence>
              {readyOrders.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8 text-emerald-500/60 rounded-3xl" style={{ border: '2px dashed rgba(16,185,129,0.2)' }}>Kosong</motion.div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

function OrderCard({ order, index, onAdvance }: { order: Order, index: number, onAdvance: () => void }) {
  // Hitung waktu tunggu
  const waitMinutes = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
  const isLate = waitMinutes > 15; // Lebih dari 15 menit anggap telat

  const statusStyles = {
    pending: { borderLeft: '4px solid rgba(0,0,0,0.2)' },
    preparing: { borderLeft: '4px solid #f59e0b', background: 'rgba(245,158,11,0.05)' },
    ready: { borderLeft: '4px solid #10b981', background: 'rgba(16,185,129,0.05)' },
    delivered: { display: 'none' }
  };

  const actionLabels = {
    pending: 'Mulai Masak',
    preparing: 'Selesai Dimasak',
    ready: 'Sudah Diantar',
    delivered: ''
  };

  const actionClasses = {
    pending: 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30',
    preparing: 'btn-emerald-glow text-white',
    ready: 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30',
    delivered: ''
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.5, delay: Math.min(index * 0.05, 0.3) }}
      className="glass-card flex flex-col overflow-hidden"
      style={statusStyles[order.kitchen_status]}
    >
      <div className="p-4 flex justify-between items-start" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <h3 className="font-black text-lg text-slate-800">#{order.order_number}</h3>
          <p className="text-slate-500 text-xs">Oleh: {order.cashier_name ?? 'Kasir'}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-800 font-bold">{formatTime(order.created_at)}</p>
          {order.kitchen_status !== 'ready' && (
            <p className={`text-xs font-bold mt-1 ${isLate ? 'text-red-500' : 'text-slate-400'}`}>
              {waitMinutes} menit
            </p>
          )}
        </div>
      </div>
      
      <div className="p-4 flex-1 space-y-3">
        {(order.order_items ?? []).map((item, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="font-black text-lg text-slate-700 min-w-[24px]">{item.quantity}x</div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 leading-tight">{item.product_name}</p>
              {item.modifiers_snapshot && item.modifiers_snapshot.length > 0 && (
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  + {item.modifiers_snapshot.map(m => m.name).join(', ')}
                </p>
              )}
              {item.notes && (
                <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg mt-1 font-medium inline-block">
                  Catatan: {item.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 mt-auto" style={{ background: 'rgba(0,0,0,0.02)' }}>
        <button
          onClick={onAdvance}
          className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 press ${actionClasses[order.kitchen_status]}`}
        >
          {actionLabels[order.kitchen_status]}
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
