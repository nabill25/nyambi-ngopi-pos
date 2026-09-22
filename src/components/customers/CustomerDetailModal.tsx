import { useState, useEffect } from 'react';
import { X, Phone, Mail, ShoppingBag, Wallet, Clock, Gem } from 'lucide-react';
import { Customer, CustomerStats } from '../../types';
import { getCustomerStats } from '../../hooks/useCustomers';
import { formatCurrency, formatDateTime } from '../../lib/utils';

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    setIsLoading(true);
    getCustomerStats(customer.id)
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-700 text-sm font-bold">{customer.full_name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800 text-sm truncate">{customer.full_name}</h2>
            {customer.phone && <p className="text-slate-500 text-xs">{customer.phone}</p>}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-700 rounded-full flex-shrink-0">
            <Gem size={12} />
            <span className="text-xs font-bold">{(customer.loyalty_points ?? 0).toLocaleString('id-ID')}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {(customer.phone || customer.email) && (
            <div className="space-y-1.5">
              {customer.phone && (
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Phone size={13} className="text-slate-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Mail size={13} className="text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
            </div>
          )}

          {customer.notes && (
            <p className="text-slate-500 text-xs bg-slate-50 rounded-xl p-3">{customer.notes}</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={ShoppingBag} label="Transaksi" value={isLoading ? '-' : String(stats?.totalOrders ?? 0)} />
            <StatCard icon={Wallet} label="Total Belanja" value={isLoading ? '-' : formatCurrency(stats?.totalSpent ?? 0)} small />
            <StatCard icon={Clock} label="Terakhir" value={isLoading || !stats?.lastVisit ? '-' : formatDateTime(stats.lastVisit)} small />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, small }: { icon: React.ElementType; label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
      <Icon size={16} className="text-emerald-600 mx-auto mb-1.5" />
      <p className={small ? 'text-slate-800 font-bold text-xs' : 'text-slate-800 font-bold text-base'}>{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}
