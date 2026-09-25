import { useState } from 'react';
import { X, Plus, Trash2, ChefHat, FlaskConical } from 'lucide-react';
import { useProductRecipes } from '../../hooks/useProductRecipes';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { Product } from '../../types';

interface ProductRecipeManagerProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductRecipeManager({ product, onClose }: ProductRecipeManagerProps) {
  const { recipes, isLoading, error, addRecipe, deleteRecipe } = useProductRecipes(product?.id ?? null);
  const { materials } = useRawMaterials();
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');

  if (!product) return null;

  const handleAddRecipe = async () => {
    if (!selectedMaterial || !quantity) return;
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;
    await addRecipe(selectedMaterial, qty);
    setSelectedMaterial('');
    setQuantity('');
  };

  // Bahan yang belum ada di resep
  const availableMaterials = materials.filter(m => !recipes.find(r => r.raw_material_id === m.id));

  // Satuan bahan yang sedang dipilih (untuk tampilan di samping input)
  const selectedMat = materials.find(m => m.id === selectedMaterial);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FlaskConical size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-800 text-lg">Resep Bahan Baku</h2>
            <p className="text-slate-500 text-sm">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm">{error}</div>
          )}

          {/* Daftar resep */}
          {isLoading ? (
            <div className="h-24 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-2xl">
              <ChefHat size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Belum ada bahan baku terkait</p>
              <p className="text-xs mt-1 text-center text-slate-400 px-4">
                Tambahkan bahan agar stok otomatis berkurang saat terjual.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Komposisi Resep</p>
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center gap-4 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-emerald-50/50 hover:border-emerald-100 transition-all group"
                >
                  <div className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0 text-lg">
                    🧪
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {recipe.raw_material?.name}
                    </p>
                    <p className="text-xs text-slate-500">per porsi / per sajian</p>
                  </div>
                  {/* Quantity + unit dari raw_material */}
                  <div className="flex items-baseline gap-1 flex-shrink-0 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5">
                    <span className="text-lg font-bold text-emerald-600">{recipe.quantity_required}</span>
                    <span className="text-xs text-emerald-500 font-semibold">{recipe.raw_material?.unit}</span>
                  </div>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form tambah bahan */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
              <Plus size={15} />
              Tambah Bahan
            </p>

            {/* Pilih bahan baku */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Bahan Baku</label>
              <select
                value={selectedMaterial}
                onChange={(e) => { setSelectedMaterial(e.target.value); setQuantity(''); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all"
              >
                <option value="">Pilih bahan baku...</option>
                {availableMaterials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} — satuan: {m.unit} (stok: {m.stock} {m.unit})</option>
                ))}
              </select>
            </div>

            {/* Input jumlah — satuan mengikuti bahan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Jumlah Pemakaian
                {selectedMat && (
                  <span className="ml-2 text-emerald-600 font-semibold">
                    (dalam {selectedMat.unit})
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={selectedMat ? `cth: 18 (${selectedMat.unit})` : 'Pilih bahan dulu...'}
                  step="any"
                  min={0}
                  disabled={!selectedMaterial}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {/* Badge satuan */}
                {selectedMat && (
                  <div className="flex items-center justify-center px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-emerald-600 min-w-[64px]">
                    {selectedMat.unit}
                  </div>
                )}
              </div>
              {selectedMat && (
                <p className="text-xs text-slate-400 mt-1">
                  💡 Satuan mengikuti definisi bahan baku. Untuk mengubah satuan, edit bahan baku terlebih dahulu.
                </p>
              )}
            </div>

            {/* Preview + tombol tambah */}
            <div className="flex items-center gap-3 pt-1">
              {selectedMat && quantity && parseFloat(quantity) > 0 && (
                <p className="flex-1 text-xs text-slate-500">
                  Pakai <span className="font-bold text-emerald-700">{quantity} {selectedMat.unit}</span>{' '}
                  <span className="text-slate-600">{selectedMat.name}</span> per sajian
                </p>
              )}
              <button
                onClick={handleAddRecipe}
                disabled={!selectedMaterial || !quantity || parseFloat(quantity) <= 0}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-sm transition-all active:scale-95 ml-auto"
              >
                <Plus size={16} />
                Tambahkan
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
