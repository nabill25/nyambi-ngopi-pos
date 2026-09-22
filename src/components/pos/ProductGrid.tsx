import { Plus, Package, Layers, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Product, SelectedModifier } from '../../types';
import { formatCurrency, cn, getStockStatus } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import { ProductModifierModal } from './ProductModifierModal';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);

  const handleTap = (product: Product) => {
    if (product.modifier_groups && product.modifier_groups.length > 0) {
      setModifierProduct(product);
    } else {
      addItem(product);
    }
  };

  const handleConfirmModifiers = (selected: SelectedModifier[]) => {
    if (modifierProduct) addItem(modifierProduct, selected);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-3xl animate-pulse"
            style={{
              background: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Package size={48} className="mb-3 opacity-40" />
        <p className="text-sm">Tidak ada produk</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} onTap={handleTap} delay={Math.min(idx, 11) * 0.03} />
        ))}
      </div>

      <ProductModifierModal
        product={modifierProduct}
        onClose={() => setModifierProduct(null)}
        onConfirm={handleConfirmModifiers}
      />
    </>
  );
}

interface ProductCardProps {
  product: Product;
  onTap: (product: Product) => void;
  delay?: number;
}

function ProductCard({ product, onTap, delay = 0 }: ProductCardProps) {
  const stockStatus = getStockStatus(product);
  const isOutOfStock = stockStatus === 'out';
  const isLowStock = stockStatus === 'low';
  const hasModifiers = (product.modifier_groups?.length ?? 0) > 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.5, duration: 0.28, type: 'spring', bounce: 0.3 }}
      whileTap={!isOutOfStock ? { scale: 0.94 } : {}}
      onClick={() => !isOutOfStock && onTap(product)}
      disabled={isOutOfStock}
      className={cn(
        'glass-card text-left p-3 flex flex-col transition-all select-none touch-manipulation',
        isOutOfStock && 'opacity-50 cursor-not-allowed'
      )}
      style={isOutOfStock ? { filter: 'grayscale(0.4)' } : {}}
    >
      {/* Image / Icon area */}
      <div
        className="w-full h-20 mb-3 rounded-2xl overflow-hidden flex items-center justify-center relative"
        style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-3xl select-none">{product.category?.icon ?? '🍽️'}</span>
        )}

        {/* Low stock badge */}
        {isLowStock && (
          <div
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
            style={{
              background: 'rgba(245,158,11,0.9)',
              backdropFilter: 'blur(4px)',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: 'white',
            }}
          >
            <AlertTriangle size={8} />
            <span>Menipis</span>
          </div>
        )}

        {/* Modifier indicator */}
        {hasModifiers && (
          <div
            className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.85)', backdropFilter: 'blur(4px)' }}
          >
            <Layers size={10} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        <p className="text-slate-800 text-xs font-semibold leading-tight line-clamp-2 mb-1.5">
          {product.name}
        </p>
        <p className="text-sm font-bold" style={{ color: '#1f9c56' }}>{formatCurrency(product.price)}</p>
        {product.track_stock && (
          <p className={cn(
            'text-[10px] mt-0.5 font-medium',
            isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-500' : 'text-slate-400'
          )}>
            {isOutOfStock ? 'Habis' : `Stok: ${product.stock_quantity}`}
          </p>
        )}
      </div>

      {/* Add + icon (always visible on mobile, hover only on desktop) */}
      {!isOutOfStock && (
        <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none rounded-2xl opacity-0 sm:opacity-0 group-hover:opacity-100">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#1f9c56,#45b975)',
              boxShadow: '0 4px 16px rgba(31,156,86,0.45)',
            }}
          >
            <Plus size={14} className="text-white" />
          </div>
        </div>
      )}
    </motion.button>
  );
}
