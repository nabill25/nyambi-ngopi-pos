import { useState } from 'react';
import { X, Plus, Trash2, Layers } from 'lucide-react';
import { useProductModifiers } from '../../hooks/useProductModifiers';
import { ModifierSelectionType, Product } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

interface ProductModifiersManagerProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModifiersManager({ product, onClose }: ProductModifiersManagerProps) {
  const { groups, isLoading, error, createGroup, deleteGroup, addOption, deleteOption } = useProductModifiers(product?.id ?? null);
  const [groupName, setGroupName] = useState('');
  const [selectionType, setSelectionType] = useState<ModifierSelectionType>('single');
  const [isRequired, setIsRequired] = useState(false);
  const [optionInputs, setOptionInputs] = useState<Record<string, { name: string; price: string }>>({});

  if (!product) return null;

  const handleAddGroup = async () => {
    if (!groupName.trim()) return;
    await createGroup(groupName.trim(), selectionType, isRequired);
    setGroupName('');
    setSelectionType('single');
    setIsRequired(false);
  };

  const handleAddOption = async (groupId: string) => {
    const input = optionInputs[groupId];
    if (!input?.name.trim()) return;
    await addOption(groupId, input.name.trim(), parseInt(input.price, 10) || 0);
    setOptionInputs((prev) => ({ ...prev, [groupId]: { name: '', price: '' } }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Varian & Tambahan</h2>
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
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Layers size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Belum ada grup varian</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="bg-white border border-slate-100 rounded-xl p-3 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-slate-800 font-semibold text-sm flex-1">{group.name}</p>
                    <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                      {group.selection_type === 'single' ? 'Pilih 1' : 'Pilih Banyak'}
                    </span>
                    {group.is_required && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full">Wajib</span>
                    )}
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Hapus grup"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {(group.options ?? []).map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-700 text-xs flex-1">{opt.name}</span>
                        <span className="text-emerald-600 text-xs font-medium">
                          {opt.price_delta > 0 ? `+${formatCurrency(opt.price_delta)}` : 'Gratis'}
                        </span>
                        <button onClick={() => deleteOption(opt.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={optionInputs[group.id]?.name ?? ''}
                      onChange={(e) => setOptionInputs((prev) => ({ ...prev, [group.id]: { name: e.target.value, price: prev[group.id]?.price ?? '' } }))}
                      placeholder="Nama opsi (mis. Large)"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={optionInputs[group.id]?.price ?? ''}
                      onChange={(e) => setOptionInputs((prev) => ({ ...prev, [group.id]: { name: prev[group.id]?.name ?? '', price: e.target.value } }))}
                      placeholder="+Rp"
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleAddOption(group.id)}
                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-white transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New group form */}
          <div className="bg-white rounded-xl p-3 border border-dashed border-slate-200 space-y-2">
            <p className="text-slate-600 text-xs font-medium">Tambah Grup Varian Baru</p>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Mis. Ukuran, Level Gula, Tambahan"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {(['single', 'multiple'] as ModifierSelectionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectionType(type)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      selectionType === type ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {type === 'single' ? 'Pilih 1' : 'Pilih Banyak'}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 flex-shrink-0">
                <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="rounded" />
                Wajib pilih
              </label>
            </div>
            <button
              onClick={handleAddGroup}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Tambah Grup</span>
            </button>
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
