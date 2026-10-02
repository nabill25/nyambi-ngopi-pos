import { Users } from 'lucide-react';
import { CashierOption } from '../../types';

interface CashierFilterProps {
  cashiers: CashierOption[];
  value: string | null;
  onChange: (cashierId: string | null) => void;
}

// Pilih satu akun kasir, atau "Semua Kasir" (null) untuk menggabungkan semua akun
export function CashierFilter({ cashiers, value, onChange }: CashierFilterProps) {
  return (
    <label className="relative flex items-center">
      <Users size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label="Filter kasir"
        className="glass-input rounded-2xl pl-9 pr-8 py-2 text-sm text-slate-800 max-w-[220px]"
      >
        <option value="">Semua Kasir</option>
        {cashiers.map((cashier) => (
          <option key={cashier.id} value={cashier.id}>
            {cashier.full_name}
            {cashier.role !== 'cashier' ? ` (${cashier.role})` : ''}
            {!cashier.is_active ? ' - nonaktif' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
