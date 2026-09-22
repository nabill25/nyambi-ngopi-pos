import { useEffect, useState } from 'react';
import { Search, Eye, X, Printer, XCircle, RefreshCw, CheckCircle2, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel, getStatusLabel, getStatusColor, cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { ShiftHistoryList } from '../components/pos/ShiftHistoryList';
import { buildReceiptHTML } from '../components/pos/ReceiptModal';

type Tab = 'transactions' | 'shifts';

export function OrdersPage() {
  const { orders, isLoading, error, fetchTodayOrders, cancelOrder, getOrderDetail } = useOrders();
  const { isAdmin } = useAuthStore();
  const { settings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('transactions');
  const [search, setSearch] = useState('');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchTodayOrders();
  }, [fetchTodayOrders]);

  const filtered = orders.filter((o) =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.cashier_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleViewDetail = async (orderId: string) => {
    const order = await getOrderDetail(orderId);
    if (order) setDetailOrder(order);
  };

  const handleCancel = async () => {
    if (!cancelConfirm || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      await cancelOrder(cancelConfirm, cancelReason.trim());
      await fetchTodayOrders();
      setCancelConfirm(null);
      setCancelReason('');
      if (detailOrder?.id === cancelConfirm) setDetailOrder(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReprintOrder = (order: Order) => {
    setIsPrinting(true);
    try {
      const html = buildReceiptHTML(order, settings);
      const win = window.open('', '_blank', 'width=420,height=700');
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 400);
    } finally {
      setTimeout(() => setIsPrinting(false), 500);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 h-full overflow-y-auto">
      {/* Tab bar — glass pill */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex gap-1 p-1 rounded-2xl w-fit relative"
        style={{
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        {([['transactions', 'Transaksi'], ['shifts', 'Riwayat Shift']] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('relative px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95')}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeOrdersTab"
                className="absolute inset-0 rounded-xl"
                transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                style={{ background: 'linear-gradient(135deg,#1f9c56,#45b975)', boxShadow: '0 4px 16px rgba(31,156,86,0.35)' }}
              />
            )}
            <span className={cn('relative z-10', activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-700')}>{label}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'shifts' ? (
          <motion.div key="shifts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <ShiftHistoryList />
          </motion.div>
        ) : (
          <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor struk atau kasir..."
                  className="glass-input w-full rounded-2xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                onClick={fetchTodayOrders}
                className="glass-btn p-2.5 rounded-xl text-slate-600 hover:text-slate-800 transition-all"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Transaksi', value: orders.length, color: '#1f9c56' },
                { label: 'Selesai', value: orders.filter((o) => o.status === 'completed').length, color: '#1f9c56' },
                { label: 'Total Pendapatan', value: formatCurrency(orders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.total_amount, 0)), color: '#1f9c56' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card p-3 text-center"
                >
                  <p className="font-bold text-base" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>
            )}

            {/* Transaction list */}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.4)' }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Receipt size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.035 }}
                    className="glass-card flex items-center gap-3 p-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 font-mono text-sm font-bold">{order.order_number}</span>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', getStatusColor(order.status))}
                          style={order.status === 'completed' ? { background: 'rgba(34,197,94,0.1)' } : { background: 'rgba(239,68,68,0.1)' }}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-slate-500 text-xs">{formatDateTime(order.created_at)}</span>
                        <span className="text-slate-300 text-xs">·</span>
                        <span className="text-slate-500 text-xs">{getPaymentMethodLabel(order.payment_method)}</span>
                        {order.cashier_name && (
                          <>
                            <span className="text-slate-300 text-xs">·</span>
                            <span className="text-slate-500 text-xs">{order.cashier_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: '#1f9c56' }}>{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="p-2 rounded-xl transition-all press"
                        style={{ background: 'rgba(0,0,0,0.04)', color: '#64748b' }}
                        title="Lihat detail"
                      >
                        <Eye size={14} />
                      </button>
                      {isAdmin() && order.status === 'completed' && (
                        <button
                          onClick={() => { setCancelConfirm(order.id); setCancelReason(''); }}
                          className="p-2 rounded-xl transition-all press"
                          style={{ background: 'rgba(0,0,0,0.04)', color: '#94a3b8' }}
                          title="Void transaksi"
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {detailOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailOrder(null)}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.12, duration: 0.38 }}
              className="glass-modal relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <h2 className="flex-1 font-bold text-slate-800 text-base font-mono">{detailOrder.order_number}</h2>
                <button
                  onClick={() => setDetailOrder(null)}
                  className="p-2 rounded-xl transition-all press"
                  style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Tanggal', formatDateTime(detailOrder.created_at)],
                    ['Kasir', detailOrder.cashier_name ?? '-'],
                    ['Metode Bayar', getPaymentMethodLabel(detailOrder.payment_method)],
                    ['Status', getStatusLabel(detailOrder.status)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl p-3" style={{ background: 'rgba(0,0,0,0.03)' }}>
                      <p className="text-slate-400 text-xs mb-0.5">{k}</p>
                      <p className="text-slate-800 font-semibold text-sm">{v}</p>
                    </div>
                  ))}
                </div>

                {detailOrder.status === 'cancelled' && detailOrder.cancel_reason && (
                  <div className="rounded-2xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <p className="text-red-500 text-xs font-semibold mb-1">Alasan Void</p>
                    <p className="text-red-600 text-sm">{detailOrder.cancel_reason}</p>
                  </div>
                )}

                <div className="space-y-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px' }}>
                  {(detailOrder.order_items ?? []).map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs w-6 font-mono">{item.quantity}x</span>
                        <span className="text-slate-800 text-sm flex-1 font-medium">{item.product_name}</span>
                        <span className="text-sm font-bold" style={{ color: '#1f9c56' }}>{formatCurrency(item.subtotal)}</span>
                      </div>
                      {item.modifiers_snapshot && item.modifiers_snapshot.length > 0 && (
                        <p className="text-slate-400 text-xs pl-8">{item.modifiers_snapshot.map((m) => m.name).join(', ')}</p>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px' }}>
                  <div className="flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{formatCurrency(detailOrder.subtotal)}</span></div>
                  {detailOrder.discount_amount > 0 && <div className="flex justify-between text-sm text-green-500"><span>{detailOrder.promo_name ? `Promo: ${detailOrder.promo_name}` : 'Diskon'}</span><span>-{formatCurrency(detailOrder.discount_amount)}</span></div>}
                  {detailOrder.tax_amount > 0 && <div className="flex justify-between text-sm text-slate-500"><span>Pajak</span><span>{formatCurrency(detailOrder.tax_amount)}</span></div>}
                  {!!detailOrder.points_discount_amount && detailOrder.points_discount_amount > 0 && <div className="flex justify-between text-sm text-amber-500"><span>Poin ({detailOrder.points_redeemed})</span><span>-{formatCurrency(detailOrder.points_discount_amount)}</span></div>}
                  <div className="flex justify-between font-bold text-slate-800 text-base pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span>Total</span>
                    <span style={{ color: '#1f9c56' }}>{formatCurrency(detailOrder.total_amount)}</span>
                  </div>
                  {detailOrder.change_amount > 0 && <div className="flex justify-between text-sm text-slate-500"><span>Kembalian</span><span>{formatCurrency(detailOrder.change_amount)}</span></div>}
                  {!!detailOrder.points_earned && detailOrder.points_earned > 0 && <div className="flex justify-between text-sm text-slate-400"><span>Poin didapat</span><span>+{detailOrder.points_earned}</span></div>}
                </div>
              </div>

              <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <button
                  onClick={() => handleReprintOrder(detailOrder)}
                  disabled={isPrinting}
                  className="btn-emerald-glow w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm transition-all"
                >
                  {isPrinting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Printer size={16} />
                  )}
                  <span>{isPrinting ? 'Mencetak...' : 'Cetak Ulang Struk'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Void Confirm Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {cancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setCancelConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              className="glass-modal relative max-w-sm w-full rounded-3xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <XCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-slate-800 font-bold text-lg mb-1">Void Transaksi?</h3>
              <p className="text-slate-500 text-sm mb-5">Transaksi ini akan dibatalkan. Tindakan ini <strong>tidak dapat diurungkan</strong>.</p>
              <div className="space-y-1.5 mb-5">
                <label className="text-slate-600 text-xs font-semibold">Alasan Void *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="Misal: salah input, pelanggan batal, dll"
                  autoFocus
                  className="glass-input w-full rounded-2xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelConfirm(null)}
                  className="glass-btn flex-1 py-3 rounded-2xl text-slate-600 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling || !cancelReason.trim()}
                  className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm disabled:opacity-50 transition-all active:scale-97 press"
                  style={{ boxShadow: '0 4px 20px rgba(239,68,68,0.35)' }}
                >
                  {isCancelling ? 'Memproses...' : 'Void'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
