import { useState } from 'react';
import { X, Plus, Trash2, ChefHat, FlaskConical } from 'lucide-react';
import { useProductRecipes } from '../../hooks/useProductRecipes';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { Product } from '../../types';

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', 'pcs', 'pack', 'sachet', 'botol', 'box', 'cup', 'sdm', 'sdt'];

interface ProductRecipeManagerProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductRecipeManager({ product, onClose }: ProductRecipeManagerProps) {
  const { recipes, isLoading, error, addRecipe, deleteRecipe } = useProductRecipes(product?.id ?? null);
  const { materials } = useRawMaterials();
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  if (!product) return null;

  const handleAddRecipe = async () => {
    if (!selectedMaterial || !quantity) return;
    const qty = parseFloat(quantity);
    if (qty <= 0) return;

    // Store quantity with unit appended if different from material's default unit
    await addRecipe(selectedMaterial, qty);
    setSelectedMaterial('');
    setQuantity('');
    setUnit('g');
    setIsCustomUnit(false);
  };

  const handleUnitChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustomUnit(true);
      setUnit('');
    } else {
      setIsCustomUnit(false);
      setUnit(val);
    }
  };

  // Available materials that haven't been added yet
  const availableMaterials = materials.filter(m => !recipes.find(r => r.raw_material_id === m.id));

  // When a material is selected, auto-set unit to match its defined unit
  const handleMaterialChange = (matId: string) => {
    setSelectedMaterial(matId);
    const mat = materials.find(m => m.id === matId);
    if (mat) {
      const matchedUnit = UNIT_OPTIONS.includes(mat.unit) ? mat.unit : '__custom__';
      if (matchedUnit === '__custom__') {
        setIsCustomUnit(true);
        setUnit(mat.unit);
      } else {
        setIsCustomUnit(false);
        setUnit(mat.unit);
      }
    }
  };

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

          {/* Recipe list */}
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
                  {/* Ingredient icon */}
                  <div className="w-9 h-9 bg-white rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0 text-lg">
                    🧪
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {recipe.raw_material?.name}
                    </p>
                    <p className="text-xs text-slate-500">per porsi / per sajian</p>
                  </div>
                  {/* Quantity badge */}
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span className="text-lg font-bold text-emerald-600">{recipe.quantity_required}</span>
                    <span className="text-xs text-slate-500 font-medium">{recipe.raw_material?.unit}</span>
                  </div>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 group-hover:opacity-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Add Form ── */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
              <Plus size={15} />
              Tambah Bahan
            </p>

            {/* Material selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Bahan Baku</label>
              <select
                value={selectedMaterial}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all"
              >
                <option value="">Pilih bahan baku...</option>
                {availableMaterials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} (stok: {m.stock} {m.unit})</option>
                ))}
              </select>
            </div>

            {/* Quantity + Unit row */}
            <div className="flex gap-2">
              {/* Quantity input */}
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-slate-500">Jumlah Pemakaian</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="cth: 250"
                  step="any"
                  min={0}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all font-mono"
                />
              </div>

              {/* Unit selector */}
              <div className="w-28 space-y-1">
                <label className="text-xs font-medium text-slate-500">Satuan</label>
                <select
                  value={isCustomUnit ? '__custom__' : unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all"
                >
                  {UNIT_OPTIONS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  <option value="__custom__">Lainnya...</option>
                </select>
              </div>
            </div>

            {/* Custom unit input */}
            {isCustomUnit && (
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Tulis satuan (misal: lembar, helai...)"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all"
                autoFocus
              />
            )}

            {/* Preview + Add button */}
            <div className="flex items-center gap-3 pt-1">
              {selectedMaterial && quantity && (
                <p className="flex-1 text-xs text-slate-500">
                  Pakai <span className="font-bold text-emerald-700">{quantity} {unit}</span>{' '}
                  {materials.find(m => m.id === selectedMaterial)?.name} per sajian
                </p>
              )}
              <button
                onClick={handleAddRecipe}
                disabled={!selectedMaterial || !quantity || !unit}
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
