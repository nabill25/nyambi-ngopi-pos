import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Product, Category } from '../../types';
import { cn } from '../../lib/utils';
import { uploadProductImage, deleteProductImage } from '../../lib/storage';
import { ProductImagePicker } from './ProductImagePicker';
import { FormField, ToggleField, PRODUCT_INPUT_CLASS as INPUT_CLASS } from './ProductFormFields';

interface ProductFormProps {
  isOpen: boolean;
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Product>) => Promise<void>;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  cost_price: '',
  category_id: '',
  image_url: '',
  sku: '',
  is_active: true,
  track_stock: false,
  stock_quantity: '0',
  low_stock_threshold: '5',
  sort_order: '0',
};

export function ProductForm({ isOpen, product, categories, onClose, onSave }: ProductFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageResult, setImageResult] = useState<{ file: File | null; removed: boolean }>({ file: null, removed: false });
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const isLoading = uploadPhase !== 'idle';

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? '',
        price: String(product.price),
        cost_price: String(product.cost_price ?? ''),
        category_id: product.category_id ?? '',
        image_url: product.image_url ?? '',
        sku: product.sku ?? '',
        is_active: product.is_active,
        track_stock: product.track_stock,
        stock_quantity: String(product.stock_quantity ?? 0),
        low_stock_threshold: String(product.low_stock_threshold ?? 5),
        sort_order: String(product.sort_order),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setImageResult({ file: null, removed: false });
    setError(null);
  }, [product, isOpen]);

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nama produk wajib diisi'); return; }
    const price = parseInt(form.price, 10);
    if (isNaN(price) || price < 0) { setError('Harga tidak valid'); return; }

    setError(null);
    try {
      let finalImageUrl: string | null = form.image_url || null;

      if (imageResult.file) {
        setUploadPhase('uploading');
        finalImageUrl = await uploadProductImage(imageResult.file);
        if (product?.image_url) void deleteProductImage(product.image_url);
      } else if (imageResult.removed) {
        finalImageUrl = null;
        if (product?.image_url) void deleteProductImage(product.image_url);
      }

      setUploadPhase('saving');
      await onSave({
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        cost_price: form.cost_price ? parseInt(form.cost_price, 10) : null,
        category_id: form.category_id || null,
        image_url: finalImageUrl,
        sku: form.sku.trim() || null,
        is_active: form.is_active,
        track_stock: form.track_stock,
        stock_quantity: form.track_stock ? parseInt(form.stock_quantity, 10) : undefined,
        low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
        sort_order: parseInt(form.sort_order, 10) || 0,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setUploadPhase('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base flex-1">
            {product ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[75vh]">
          <div className="p-6 space-y-4">
            {/* Name */}
            <FormField label="Nama Produk *">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Contoh: Americano"
                className={INPUT_CLASS}
                required
              />
            </FormField>

            {/* Description */}
            <FormField label="Deskripsi">
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Deskripsi singkat produk..."
                rows={2}
                className={cn(INPUT_CLASS, 'resize-none')}
              />
            </FormField>

            {/* Price & Cost */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Harga Jual (Rp) *">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  placeholder="18000"
                  min={0}
                  className={INPUT_CLASS}
                  required
                />
              </FormField>
              <FormField label="HPP (Rp)">
                <input
                  type="number"
                  value={form.cost_price}
                  onChange={(e) => set('cost_price', e.target.value)}
                  placeholder="10000"
                  min={0}
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            {/* Category & Sort */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Kategori">
                <select
                  value={form.category_id}
                  onChange={(e) => set('category_id', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">-- Tanpa Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Urutan">
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => set('sort_order', e.target.value)}
                  min={0}
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            {/* Photo upload */}
            <ProductImagePicker existingUrl={form.image_url || null} onChange={setImageResult} />

            {/* SKU */}
            <FormField label="SKU / Kode Produk">
              <input
                type="text"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="Opsional"
                className={INPUT_CLASS}
              />
            </FormField>

            {/* Toggles */}
            <div className="space-y-3">
              <ToggleField
                label="Produk Aktif"
                desc="Tampil di menu kasir"
                checked={form.is_active}
                onChange={(v) => set('is_active', v)}
              />
              <ToggleField
                label="Lacak Stok"
                desc="Kelola stok produk ini"
                checked={form.track_stock}
                onChange={(v) => set('track_stock', v)}
              />
            </div>

            {/* Stock */}
            {form.track_stock && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Jumlah Stok">
                  <input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => set('stock_quantity', e.target.value)}
                    min={0}
                    className={INPUT_CLASS}
                  />
                </FormField>
                <FormField label="Ambang Batas Menipis">
                  <input
                    type="number"
                    value={form.low_stock_threshold}
                    onChange={(e) => set('low_stock_threshold', e.target.value)}
                    min={0}
                    className={INPUT_CLASS}
                  />
                </FormField>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm animate-fadeIn">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>
                {uploadPhase === 'uploading' ? 'Mengunggah foto...' : uploadPhase === 'saving' ? 'Menyimpan...' : 'Simpan'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
