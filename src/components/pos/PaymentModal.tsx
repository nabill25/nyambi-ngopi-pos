import { useState } from 'react';
import { X, Banknote, Smartphone, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency, cn, getPaymentMethodLabel, playSuccessSound } from '../../lib/utils';
import { PaymentMethod, Order, Customer } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePrinter } from '../../hooks/usePrinter';
import { toast } from 'sonner';
import { CustomerPickerModal } from './CustomerPickerModal';
import { PaymentCustomerSection } from './PaymentCustomerSection';
import { LoyaltyPointsSection } from './LoyaltyPointsSection';
import { PaymentSummary } from './PaymentSummary';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { QrisPaymentModal } from './QrisPaymentModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

const QUICK_AMOUNTS = [50000, 100000, 50000, 20000];

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { items, getTotal, getSubtotal, getTotalDiscount, discountPercent, discountAmount, clearCart, customerId, customerName, customerPoints, pointsToRedeem, setCustomer, setPointsToRedeem, promoCode, promoName } = useCartStore();
  const { settings } = useSettingsStore();
  const { createOrder } = useOrders();
  const isOnline = useOnlineStatus();
  const { printReceipt } = usePrinter();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);

  const handleSelectCustomer = (customer: Customer) => {
    setCustomer(customer.id, customer.full_name, customer.loyalty_points);
  };

  const total = getTotal();
  const subtotal = getSubtotal();
  const totalDiscount = getTotalDiscount();
  const taxEnabled = settings.tax_enabled;
  const taxPercent = settings.tax_percent;
  const taxAmount = taxEnabled ? Math.round((subtotal - totalDiscount) * (taxPercent / 100)) : 0;
  const totalBeforePoints = total + taxAmount;

  const loyaltyActive = !!customerId && settings.loyalty_enabled && isOnline;
  const redeemRate = settings.loyalty_redeem_rate;
  const maxRedeemable = loyaltyActive && redeemRate > 0
    ? Math.min(customerPoints, Math.floor(totalBeforePoints / redeemRate))
    : 0;
  const pointsDiscount = loyaltyActive ? Math.min(pointsToRedeem, maxRedeemable) * redeemRate : 0;
  const grandTotal = Math.max(0, totalBeforePoints - pointsDiscount);
  const pointsToEarn = loyaltyActive && settings.loyalty_earn_rate > 0
    ? Math.floor(grandTotal / settings.loyalty_earn_rate)
    : 0;

  const paidNum = parseFloat(paidAmount.replace(/\D/g, '')) || 0;
  const change = selectedMethod === 'cash' ? Math.max(0, paidNum - grandTotal) : 0;
  const isValidCash = selectedMethod !== 'cash' || paidNum >= grandTotal;

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? parseInt(num, 10).toLocaleString('id-ID') : '';
  };

  const addAmount = (amount: number) => {
    const current = parseFloat(paidAmount.replace(/\D/g, '')) || 0;
    setPaidAmount(formatInput(String(current + amount)));
  };

  const executePayment = async (overrideMethod?: PaymentMethod) => {
    const methodToUse = overrideMethod || selectedMethod;
    const paid = methodToUse === 'cash' ? paidNum : grandTotal;
    
    setIsProcessing(true);
    setError(null);
    try {
      const order = await createOrder({
        items,
        paymentMethod: methodToUse,
        discountPercent,
        discountAmount,
        paidAmount: paid,
        customerId,
        customerName,
        promoCode,
        promoName,
        pointsToRedeem: loyaltyActive ? Math.min(pointsToRedeem, maxRedeemable) : 0,
      });

      playSuccessSound();

      if (order && settings) {
        printReceipt(order, settings);
      }

      toast.success('Pembayaran berhasil!');
      clearCart();
      onSuccess(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      throw err; // Re-throw so QrisPaymentModal can catch it
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!isValidCash) return;
    
    if (selectedMethod === 'qris') {
      setShowQrisModal(true);
      return;
    }

    await executePayment();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0" 
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
              onClick={onClose} 
            />

            {/* Modal */}
            <motion.div 
              initial={{ opacity: 0, y: 80, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 80, scale: 0.96 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.38 }}
              className="glass-modal relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="font-bold text-slate-800 text-base flex-1">Pembayaran</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Customer */}
                <PaymentCustomerSection
                  customerId={customerId}
                  customerName={customerName}
                  onPick={() => setShowCustomerPicker(true)}
                  onClear={() => setCustomer(null, null)}
                />

                {loyaltyActive && (
                  <LoyaltyPointsSection
                    availablePoints={customerPoints}
                    redeemRate={redeemRate}
                    maxRedeemable={maxRedeemable}
                    pointsToRedeem={pointsToRedeem}
                    pointsToEarn={pointsToEarn}
                    onChange={setPointsToRedeem}
                  />
                )}

                {/* Summary */}
                <PaymentSummary
                  subtotal={subtotal}
                  totalDiscount={totalDiscount}
                  promoName={promoName}
                  taxEnabled={taxEnabled}
                  taxAmount={taxAmount}
                  taxLabel={settings.tax_label}
                  taxPercent={taxPercent}
                  pointsDiscount={pointsDiscount}
                  pointsUsed={Math.min(pointsToRedeem, maxRedeemable)}
                  grandTotal={grandTotal}
                  isOnline={isOnline}
                />

                {/* Payment method */}
                <PaymentMethodSelector
                  selectedMethod={selectedMethod}
                  onSelect={(method) => { setSelectedMethod(method); setPaidAmount(''); }}
                />

                {/* Cash input */}
                {selectedMethod === 'cash' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Jumlah Bayar</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(formatInput(e.target.value))}
                          placeholder="0"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Quick amounts */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setPaidAmount(formatInput(String(grandTotal)))}
                        className="col-span-2 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 text-xs font-semibold hover:bg-emerald-500/30 transition-all active:scale-95"
                      >
                        Uang Pas
                      </button>
                      {QUICK_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => addAmount(amt)}
                          className="py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs hover:text-slate-800 hover:bg-slate-50 transition-all active:scale-95"
                        >
                          +{amt >= 1000 ? `${amt / 1000}rb` : amt}
                        </button>
                      ))}
                    </div>

                    {/* Change */}
                    {paidNum > 0 && (
                      <div className={cn(
                        'flex justify-between items-center p-3 rounded-xl animate-fadeIn',
                        isValidCash ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                      )}>
                        <span className={cn('text-sm font-medium', isValidCash ? 'text-green-400' : 'text-red-400')}>
                          {isValidCash ? 'Kembalian' : 'Kurang'}
                        </span>
                        <span className={cn('font-bold text-lg', isValidCash ? 'text-green-400' : 'text-red-400')}>
                          {formatCurrency(Math.abs(paidNum - grandTotal))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* QRIS / Transfer info */}
                {selectedMethod === 'qris' && (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-4">
                    {isOnline ? (
                      <div className="bg-white p-2 rounded-xl">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NyambiNgopi-Rp${grandTotal}`} alt="QRIS" className="w-32 h-32 opacity-90" />
                      </div>
                    ) : (
                      <p className="text-amber-600 text-xs">QR Code butuh koneksi internet untuk ditampilkan</p>
                    )}
                    <div>
                      <p className="text-slate-800 font-bold text-sm">QRIS Nyambi Ngopi</p>
                      <p className="text-slate-500 text-xs mt-1">Minta pelanggan scan QR Code ini menggunakan aplikasi e-Wallet atau Mobile Banking mereka.</p>
                    </div>
                  </div>
                )}

                {selectedMethod === 'transfer' && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                    <p className="text-blue-300 text-sm">
                      🏦 Konfirmasi bukti transfer dari pelanggan sebelum menekan Proses
                    </p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Process button */}
              <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || !isValidCash}
                  className="btn-emerald-glow w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-base transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Proses Pembayaran</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomerPickerModal
        isOpen={showCustomerPicker}
        onClose={() => setShowCustomerPicker(false)}
        onSelect={handleSelectCustomer}
      />

      <QrisPaymentModal
        isOpen={showQrisModal}
        onClose={() => setShowQrisModal(false)}
        amount={grandTotal}
        onSuccess={async () => {
          await executePayment('qris');
          setShowQrisModal(false);
        }}
      />
    </>
  );
}
