import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductList } from '../components/menu/ProductList';
import { ProductForm } from '../components/menu/ProductForm';
import { ProductModifiersManager } from '../components/menu/ProductModifiersManager';
import { ProductRecipeManager } from '../components/menu/ProductRecipeManager';
import { CategoryList } from '../components/menu/CategoryList';
import { PromotionsTab } from '../components/menu/PromotionsTab';
import { RawMaterialsTab } from '../components/menu/RawMaterialsTab';
import { Product } from '../types';
import { cn } from '../lib/utils';

type Tab = 'products' | 'categories' | 'promotions' | 'raw_materials';

export function MenuPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [modifiersProduct, setModifiersProduct] = useState<Product | null>(null);
  const [recipesProduct, setRecipesProduct] = useState<Product | null>(null);

  const { products, isLoading, createProduct, updateProduct, deleteProduct, toggleActive } = useProducts();
  const { categories, isLoading: catLoading, createCategory, updateCategory, deleteCategory } = useCategories();

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditProduct(null);
    setShowForm(true);
  };

  const handleSave = async (data: Partial<Product>) => {
    if (editProduct) {
      await updateProduct(editProduct.id, data);
    } else {
      await createProduct(data as Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>);
    }
  };

  const handleDelete = async (product: Product) => {
    setDeleteConfirm(product);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteProduct(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleToggle = async (product: Product) => {
    await toggleActive(product.id, !product.is_active);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'transparent' }}>
      {/* Tab bar */}
      <div className="px-4 lg:px-6 pt-4 pb-2 flex-shrink-0 z-10" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1 p-1 rounded-2xl w-fit relative" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
          {([['products', 'Menu & Produk'], ['categories', 'Kategori'], ['promotions', 'Promo'], ['raw_materials', 'Bahan Baku']] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95',
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeMenuTab"
                  className="absolute inset-0 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                  style={{ background: 'linear-gradient(135deg,#1f9c56,#45b975)', boxShadow: '0 4px 16px rgba(31,156,86,0.35)' }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'products' ? (
          <ProductList
            products={products}
            categories={categories}
            isLoading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onManageModifiers={setModifiersProduct}
            onManageRecipes={setRecipesProduct}
          />
        ) : activeTab === 'categories' ? (
          <CategoryList
            categories={categories}
            isLoading={catLoading}
            onCreate={createCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        ) : activeTab === 'promotions' ? (
          <PromotionsTab />
        ) : (
          <RawMaterialsTab />
        )}
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showForm}
        product={editProduct}
        categories={categories}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
      />

      {/* Modifiers Manager */}
      <ProductModifiersManager
        product={modifiersProduct}
        onClose={() => setModifiersProduct(null)}
      />

      {/* Recipes Manager */}
      <ProductRecipeManager
        product={recipesProduct}
        onClose={() => setRecipesProduct(null)}
      />

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-overlayIn" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn">
            <h3 className="text-slate-800 font-bold mb-2">Hapus Produk?</h3>
            <p className="text-slate-600 text-sm mb-6">
              Produk <strong className="text-slate-800">{deleteConfirm.name}</strong> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 text-sm transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-all active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
