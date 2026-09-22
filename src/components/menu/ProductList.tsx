import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Package, AlertCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Category } from '../../types';
import { formatCurrency, cn, getStockStatus } from '../../lib/utils';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggle: (product: Product) => void;
  onManageModifiers: (product: Product) => void;
  onManageRecipes: (product: Product) => void;
}

export function ProductList({ products, categories, isLoading, onAdd, onEdit, onDelete, onToggle, onManageModifiers, onManageRecipes }: ProductListProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="glass-input w-full rounded-2xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="glass-input rounded-2xl px-3 py-2.5 text-sm text-slate-800"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        <button
          onClick={onAdd}
          className="btn-emerald-glow flex items-center gap-2 px-4 py-2.5 text-white rounded-2xl text-sm font-semibold transition-all active:scale-95 press"
        >
          <Plus size={16} />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Menu', value: products.length, color: 'text-slate-800' },
          { label: 'Aktif', value: products.filter((p) => p.is_active).length, color: 'text-green-400' },
          { label: 'Nonaktif', value: products.filter((p) => !p.is_active).length, color: 'text-red-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-3 text-center">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Package size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Tidak ada produk</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onEdit={() => onEdit(product)}
              onDelete={() => onDelete(product)}
              onToggle={() => onToggle(product)}
              onManageModifiers={() => onManageModifiers(product)}
              onManageRecipes={() => onManageRecipes(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onManageModifiers: () => void;
  onManageRecipes: () => void;
}

function ProductRow({ product, onEdit, onDelete, onToggle, onManageModifiers, onManageRecipes }: ProductRowProps) {
  const stockStatus = getStockStatus(product);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', bounce: 0.3 }}
      className={cn(
        'flex items-center gap-3 p-3 transition-colors glass-card',
        product.is_active ? 'hover:bg-white/40' : 'opacity-60'
      )}>
      {/* Image / Icon */}
      <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.5)' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">{product.category?.icon ?? '🍽️'}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-slate-800 font-medium text-sm truncate">{product.name}</p>
          {!product.is_active && (
            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full">Nonaktif</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-emerald-400 font-semibold text-sm">{formatCurrency(product.price)}</span>
          {product.category && (
            <span className="text-slate-500 text-xs">{product.category.icon} {product.category.name}</span>
          )}
          {product.track_stock && (
            <span className={cn(
              'text-xs flex items-center gap-0.5 font-medium',
              stockStatus === 'out' ? 'text-red-400' : stockStatus === 'low' ? 'text-amber-500' : 'text-slate-500'
            )}>
              <AlertCircle size={10} />
              {stockStatus === 'low' ? `Menipis: ${product.stock_quantity}` : `Stok: ${product.stock_quantity}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        >
          {product.is_active
            ? <ToggleRight size={20} className="text-green-400" />
            : <ToggleLeft size={20} className="text-slate-400" />
          }
        </button>
        <button
          onClick={onManageModifiers}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-500/10 transition-all active:scale-90"
          title="Kelola varian & tambahan"
        >
          <Layers size={15} />
        </button>
        <button
          onClick={onManageRecipes}
          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-500/10 transition-all active:scale-90"
          title="Kelola resep bahan baku"
        >
          <Package size={15} />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all active:scale-90"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  );
}
