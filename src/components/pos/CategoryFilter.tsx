import { Category } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface CategoryFilterProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide relative">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95',
          selectedId === null
            ? 'text-white'
            : 'text-slate-600 hover:text-slate-700 glass-pill hover:bg-white/60 border-0'
        )}
      >
        {selectedId === null && (
          <motion.div
            layoutId="activeCategory"
            className="absolute inset-0 rounded-2xl"
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            style={{ zIndex: -1, background: 'linear-gradient(135deg,#1f9c56,#45b975)', boxShadow: '0 4px 20px rgba(31,156,86,0.40)' }}
          />
        )}
        <span className="relative z-10">🍽️</span>
        <span className="relative z-10">Semua</span>
      </button>

      {categories
        .filter((c) => c.is_active)
        .map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              'relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95',
              selectedId === cat.id
                ? 'text-white'
                : 'text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200'
            )}
          >
            {selectedId === cat.id && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                style={{ zIndex: -1 }}
              />
            )}
            <span className="relative z-10">{cat.icon}</span>
            <span className="relative z-10">{cat.name}</span>
          </button>
        ))}
    </div>
  );
}
