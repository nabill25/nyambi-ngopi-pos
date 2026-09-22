import { useState } from 'react';
import { X, Plus, Trash2, ChefHat } from 'lucide-react';
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
    if (qty <= 0) return;

    await addRecipe(selectedMaterial, qty);
    setSelectedMaterial('');
    setQuantity('');
  };

  // Available materials that haven't been added yet
  const availableMaterials = materials.filter(m => !recipes.find(r => r.raw_material_id === m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Resep Bahan Baku</h2>
            <p className="text-slate-500 text-xs">{product.name}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm">{error}</div>
          )}

          {isLoading ? (
            <div className="h-24 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <ChefHat size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Belum ada bahan baku terkait</p>
              <p className="text-xs mt-1 text-center">Tambahkan bahan agar stok otomatis berkurang saat terjual.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 mb-1">Daftar Bahan Resep</p>
              {recipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl animate-fadeIn">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{recipe.raw_material?.name}</p>
                    <p className="text-xs text-slate-500">Pemakaian per porsi</p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-sm font-bold text-emerald-600">{recipe.quantity_required}</p>
                    <p className="text-xs text-slate-500">{recipe.raw_material?.unit}</p>
                  </div>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          <div className="bg-white rounded-xl p-3 border border-dashed border-slate-200 space-y-3 mt-4">
            <p className="text-slate-600 text-xs font-medium">Tambah Komposisi Bahan</p>
            <div className="flex gap-2">
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Pilih bahan...</option>
                {availableMaterials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                ))}
              </select>
              <div className="flex items-center gap-1 w-24">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Jumlah"
                  step="any"
                  min={0}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={handleAddRecipe}
                disabled={!selectedMaterial || !quantity}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center justify-center"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-all active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
