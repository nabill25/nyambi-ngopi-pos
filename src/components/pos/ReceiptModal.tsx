import { useRef, useCallback } from 'react';
import { X, Printer, CheckCircle2, ChevronRight, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '../../types';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../../lib/utils';
import { useSettingsStore } from '../../store/settingsStore';

interface ReceiptModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onNewOrder: () => void;
}

// Build the full print-ready HTML for a receipt (thermal-style)
export function buildReceiptHTML(order: Order, settings: { store_name: string; store_address?: string; store_phone?: string; store_instagram?: string; receipt_footer?: string; receipt_paper_size?: string }) {
  const items = (order.order_items ?? []);
  const itemsHTML = items.map((item) => {
    const modHTML = item.modifiers_snapshot && item.modifiers_snapshot.length > 0
      ? `<div style="padding-left:8px;color:#555;font-size:10px;">${item.modifiers_snapshot.map((m) => m.price_delta > 0 ? `${m.name} (+${formatCurrency(m.price_delta)})` : m.name).join(', ')}</div>`
      : '';
    const noteHTML = item.notes ? `<div style="padding-left:8px;color:#888;font-size:10px;">📝 ${item.notes}</div>` : '';
    return `
      <div>
        <div style="display:flex;justify-content:space-between;">
          <span style="flex:1;padding-right:8px;">${item.product_name}</span>
          <span>${formatCurrency(item.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;color:#666;font-size:10px;padding-left:4px;">
          <span>${item.quantity}x @${formatCurrency(item.product_price)}</span>
          ${item.discount_amount > 0 ? `<span style="color:#16a34a;">-${formatCurrency(item.discount_amount * item.quantity)}</span>` : ''}
        </div>
        ${modHTML}${noteHTML}
      </div>`;
  }).join('<div style="height:3px;"></div>');

  const discountRow = order.discount_amount > 0
    ? `<div style="display:flex;justify-content:space-between;color:#16a34a;"><span>${order.promo_name ? `Promo: ${order.promo_name}` : 'Diskon'}</span><span>-${formatCurrency(order.discount_amount)}</span></div>` : '';
  const taxRow = order.tax_amount > 0
    ? `<div style="display:flex;justify-content:space-between;"><span>Pajak (${order.tax_percent}%)</span><span>${formatCurrency(order.tax_amount)}</span></div>` : '';
  const pointsRow = order.points_discount_amount && order.points_discount_amount > 0
    ? `<div style="display:flex;justify-content:space-between;color:#16a34a;"><span>Poin (${order.points_redeemed})</span><span>-${formatCurrency(order.points_discount_amount)}</span></div>` : '';
  const changeRow = order.change_amount > 0
    ? `<div style="display:flex;justify-content:space-between;font-weight:700;"><span>Kembalian</span><span>${formatCurrency(order.change_amount)}</span></div>` : '';
  const pointsEarnedRow = order.points_earned && order.points_earned > 0
    ? `<div style="display:flex;justify-content:space-between;color:#666;"><span>Poin didapat</span><span>+${order.points_earned}</span></div>` : '';

  return `<!DOCTYPE html><html><head><title>Struk - ${order.order_number}</title>
<style>
  @page { size: ${settings.receipt_paper_size ?? '80mm'} auto; margin: 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #111; background: #fff; width: 100%; }
  .center { text-align: center; }
  .dash { border-top: 1px dashed #aaa; margin: 6px 0; }
  .solid { border-top: 2px solid #111; margin: 4px 0; }
  .bold { font-weight: 700; }
  .row { display: flex; justify-content: space-between; }
  .sm { font-size: 10px; color: #555; }
  .total-row { display:flex; justify-content:space-between; font-size:14px; font-weight:700; }
</style></head><body>
  <div class="center">
    <div class="bold" style="font-size:14px;">${settings.store_name}</div>
    ${settings.store_address ? `<div class="sm">${settings.store_address}</div>` : ''}
    ${settings.store_phone ? `<div class="sm">Telp: ${settings.store_phone}</div>` : ''}
    ${settings.store_instagram ? `<div class="sm">${settings.store_instagram}</div>` : ''}
  </div>

  <div class="dash"></div>
  <div class="row"><span>No. Struk</span><span class="bold">${order.order_number}</span></div>
  <div class="row"><span>Tanggal</span><span>${formatDateTime(order.created_at)}</span></div>
  <div class="row"><span>Kasir</span><span>${order.cashier_name ?? '-'}</span></div>
  ${order.customer_name ? `<div class="row"><span>Pelanggan</span><span>${order.customer_name}</span></div>` : ''}
  <div class="dash"></div>

  <div style="margin-bottom:4px;">${itemsHTML}</div>
  <div class="dash"></div>

  <div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
  ${discountRow}${taxRow}${pointsRow}
  <div class="solid"></div>
  <div class="total-row"><span>TOTAL</span><span>${formatCurrency(order.total_amount)}</span></div>
  <div class="solid"></div>

  <div style="height:4px;"></div>
  <div class="row"><span>Bayar (${getPaymentMethodLabel(order.payment_method)})</span><span>${formatCurrency(order.paid_amount)}</span></div>
  ${changeRow}${pointsEarnedRow}

  <div class="dash"></div>
  <div class="center sm">
    <div>${settings.receipt_footer ?? 'Terima kasih atas kunjungan Anda!'}</div>
    <div style="margin-top:3px;color:#999;">— Nyambi Ngopi POS —</div>
  </div>
  <div style="height:8px;"></div>
</body></html>`;
}

export function ReceiptModal({ isOpen, order, onClose, onNewOrder }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsStore();

  const handlePrint = useCallback(() => {
    if (!order) return;
    const html = buildReceiptHTML(order, settings);
    const printWindow = window.open('', '_blank', 'width=420,height=700');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  }, [order, settings]);

  return (
    <AnimatePresence>
      {isOpen && order && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.94 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="glass-modal relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: 'spring', bounce: 0.5 }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <CheckCircle2 size={18} className="text-green-500" />
              </motion.div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-800 text-sm">Pembayaran Berhasil!</h2>
                <p className="text-slate-500 text-xs font-mono">{order.order_number}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl transition-all press"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>

            {order.synced === false && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mx-4 mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400e' }}
              >
                <CloudOff size={14} className="flex-shrink-0" />
                <span>Tersimpan offline — akan otomatis terkirim saat online</span>
              </motion.div>
            )}

            {/* Receipt Preview */}
            <div className="p-4 max-h-[55vh] overflow-y-auto">
              <div
                ref={receiptRef}
                className="text-black font-mono text-xs p-4 rounded-2xl mx-auto"
                style={{
                  maxWidth: '280px',
                  minWidth: '220px',
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px dashed rgba(0,0,0,0.15)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                {/* Store header */}
                <div className="text-center mb-3">
                  <p className="font-bold text-sm">{settings.store_name}</p>
                  {settings.store_address && <p className="text-[10px] text-gray-600">{settings.store_address}</p>}
                  {settings.store_phone && <p className="text-[10px] text-gray-600">Telp: {settings.store_phone}</p>}
                  {settings.store_instagram && <p className="text-[10px] text-gray-600">{settings.store_instagram}</p>}
                </div>

                <div className="border-t border-dashed border-gray-300 my-2" />

                {/* Order info */}
                <div className="space-y-0.5 mb-2">
                  {[
                    ['No. Struk', order.order_number],
                    ['Tanggal', formatDateTime(order.created_at)],
                    ['Kasir', order.cashier_name ?? '-'],
                    ...(order.customer_name ? [['Pelanggan', order.customer_name]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-gray-600">{k}</span>
                      <span className="font-medium text-right ml-2">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-300 my-2" />

                {/* Items */}
                <div className="mb-2 space-y-1.5">
                  {(order.order_items ?? []).map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-[11px]">
                        <span className="flex-1 pr-2 leading-tight">{item.product_name}</span>
                        <span className="font-semibold flex-shrink-0">{formatCurrency(item.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500 pl-1">
                        <span>{item.quantity}x @{formatCurrency(item.product_price)}</span>
                        {item.discount_amount > 0 && <span className="text-green-600">-{formatCurrency(item.discount_amount * item.quantity)}</span>}
                      </div>
                      {item.modifiers_snapshot && item.modifiers_snapshot.length > 0 && (
                        <p className="text-[10px] text-gray-400 pl-1">{item.modifiers_snapshot.map((m) => m.price_delta > 0 ? `${m.name} (+${formatCurrency(m.price_delta)})` : m.name).join(', ')}</p>
                      )}
                      {item.notes && <p className="text-[10px] text-gray-400 pl-1">📝 {item.notes}</p>}
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-gray-300 my-2" />

                {/* Totals */}
                <div className="space-y-0.5 mb-1">
                  <div className="flex justify-between text-[11px]"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
                  {order.discount_amount > 0 && <div className="flex justify-between text-[11px] text-green-600"><span>{order.promo_name ? `Promo: ${order.promo_name}` : 'Diskon'}</span><span>-{formatCurrency(order.discount_amount)}</span></div>}
                  {order.tax_amount > 0 && <div className="flex justify-between text-[11px]"><span>Pajak ({order.tax_percent}%)</span><span>{formatCurrency(order.tax_amount)}</span></div>}
                  {!!order.points_discount_amount && order.points_discount_amount > 0 && <div className="flex justify-between text-[11px] text-green-600"><span>Poin ({order.points_redeemed})</span><span>-{formatCurrency(order.points_discount_amount)}</span></div>}
                </div>

                <div className="border-t-2 border-gray-800 my-1" />
                <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatCurrency(order.total_amount)}</span></div>
                <div className="border-t-2 border-gray-800 my-1" />

                {/* Payment */}
                <div className="space-y-0.5 mb-3">
                  <div className="flex justify-between text-[11px]"><span>Bayar ({getPaymentMethodLabel(order.payment_method)})</span><span>{formatCurrency(order.paid_amount)}</span></div>
                  {order.change_amount > 0 && <div className="flex justify-between text-[11px] font-bold"><span>Kembalian</span><span>{formatCurrency(order.change_amount)}</span></div>}
                  {!!order.points_earned && order.points_earned > 0 && <div className="flex justify-between text-[11px] text-gray-500"><span>Poin didapat</span><span>+{order.points_earned}</span></div>}
                </div>

                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="text-center text-[10px] text-gray-500">
                  <p>{settings.receipt_footer ?? 'Terima kasih atas kunjungan Anda!'}</p>
                  <p className="mt-1 text-gray-400">— Nyambi Ngopi POS —</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
              <button
                onClick={handlePrint}
                className="glass-btn flex items-center gap-2 px-4 py-3 rounded-2xl text-slate-700 text-sm font-medium press"
              >
                <Printer size={16} />
                <span>Cetak</span>
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onNewOrder}
                className="btn-emerald-glow flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>Transaksi Baru</span>
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
