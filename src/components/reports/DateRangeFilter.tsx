import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { DateRange } from '../../types';

export const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'custom', label: 'Kustom' },
];

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
  // Unik per halaman supaya animasi tab aktif tidak saling bertabrakan
  layoutId: string;
}

// Tab periode (Hari Ini / 7 Hari / Bulan Ini / Kustom) + input tanggal untuk periode kustom
export function DateRangeFilter({ value, onChange, customStart, customEnd, onCustomStartChange, onCustomEndChange, layoutId }: DateRangeFilterProps) {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex p-1 rounded-2xl relative w-fit" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
        {DATE_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={cn(
              'relative px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95',
              value === r.value ? 'text-white' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {value === r.value && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl"
                transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                style={{ background: 'linear-gradient(135deg,#1f9c56,#45b975)', boxShadow: '0 4px 16px rgba(31,156,86,0.35)' }}
              />
            )}
            <span className="relative z-10">{r.label}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence>
        {value === 'custom' && (
          <motion.div initial={{ opacity: 0, scale: 0.9, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -10 }} className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              max={customEnd || undefined}
              className="glass-input rounded-2xl px-3 py-2 text-sm text-slate-800"
            />
            <span className="text-slate-400 text-sm">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              min={customStart || undefined}
              className="glass-input rounded-2xl px-3 py-2 text-sm text-slate-800"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
