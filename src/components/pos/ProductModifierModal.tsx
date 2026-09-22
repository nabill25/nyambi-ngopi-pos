import { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { Product, SelectedModifier } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

interface ProductModifierModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (selectedModifiers: SelectedModifier[]) => void;
}

export function ProductModifierModal({ product, onClose, onConfirm }: ProductModifierModalProps) {
  // selections: groupId -> set of optionIds
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setSelections({});
  }, [product]);

  const groups = useMemo(() => product?.modifier_groups ?? [], [product]);

  const toggleOption = (groupId: string, optionId: string, selectionType: 'single' | 'multiple') => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (selectionType === 'single') {
        return { ...prev, [groupId]: current[0] === optionId ? [] : [optionId] };
      }
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [groupId]: next };
    });
  };

  const missingRequired = groups.filter((g) => g.is_required && (selections[g.id] ?? []).length === 0);

  const extraTotal = groups.reduce((sum, g) => {
    const selectedIds = selections[g.id] ?? [];
    const groupTotal = (g.options ?? [])
      .filter((o) => selectedIds.includes(o.id))
      .reduce((s, o) => s + o.price_delta, 0);
    return sum + groupTotal;
  }, 0);

  const handleConfirm = () => {
    if (missingRequired.length > 0) return;
    const result: SelectedModifier[] = [];
    groups.forEach((g) => {
      const selectedIds = selections[g.id] ?? [];
      (g.options ?? []).forEach((o) => {
        if (selectedIds.includes(o.id)) {
          result.push({ modifier_id: o.id, group_name: g.name, name: o.name, price_delta: o.price_delta });
        }
      });
    });
    onConfirm(result);
    onClose();
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800 text-base truncate">{product.name}</h2>
            <p className="text-slate-500 text-xs">{formatCurrency(product.price)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-slate-800 font-semibold text-sm">{group.name}</p>
                {group.is_required && <span className="text-xs text-amber-600 font-medium">Wajib dipilih</span>}
                {group.selection_type === 'multiple' && <span className="text-xs text-slate-400">(bisa lebih dari 1)</span>}
              </div>
              <div className="space-y-1.5">
                {(group.options ?? []).map((option) => {
                  const isSelected = (selections[group.id] ?? []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(group.id, option.id, group.selection_type)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.99]',
                        isSelected ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 flex items-center justify-center flex-shrink-0 border-2',
                        group.selection_type === 'single' ? 'rounded-full' : 'rounded',
                        isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                      )}>
                        {isSelected && <Check size={11} className="text-white" />}
                      </div>
                      <span className="text-slate-700 text-sm flex-1">{option.name}</span>
                      <span className="text-emerald-600 text-xs font-medium flex-shrink-0">
                        {option.price_delta > 0 ? `+${formatCurrency(option.price_delta)}` : 'Gratis'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleConfirm}
            disabled={missingRequired.length > 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
          >
            <span>Tambah ke Keranjang</span>
            <span>· {formatCurrency(product.price + extraTotal)}</span>
          </button>
          {missingRequired.length > 0 && (
            <p className="text-amber-600 text-xs text-center mt-2">
              Pilih {missingRequired.map((g) => g.name).join(', ')} terlebih dahulu
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
