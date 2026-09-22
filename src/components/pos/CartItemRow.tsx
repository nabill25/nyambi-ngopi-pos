import { Minus, Plus, Trash2, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../lib/utils';
import { CartItem } from '../../types';

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem, updateItemNotes } = useCartStore();
  const [showNotes, setShowNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(item.notes ?? '');

  const saveNotes = () => {
    updateItemNotes(item.id, notesInput);
    setShowNotes(false);
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-colors animate-fadeIn">
      <div className="flex items-start gap-3">
        {/* Emoji icon */}
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">{item.product.category?.icon ?? '🍽️'}</span>
        </div>

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 text-xs font-medium truncate">{item.product.name}</p>
          <p className="text-emerald-400 text-xs">{formatCurrency(item.product.price)}</p>
          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              {item.selectedModifiers.map((m) => m.price_delta > 0 ? `${m.name} (+${formatCurrency(m.price_delta)})` : m.name).join(', ')}
            </p>
          )}
          {item.notes && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">📝 {item.notes}</p>
          )}
        </div>

        {/* Quantity controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-red-500/20 hover:text-red-500 text-slate-600 flex items-center justify-center transition-all active:scale-90"
          >
            <Minus size={10} />
          </button>
          <span key={item.quantity} className="text-slate-800 font-bold text-sm w-5 text-center animate-scaleIn">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-emerald-500/20 hover:text-emerald-600 text-slate-600 flex items-center justify-center transition-all active:scale-90"
          >
            <Plus size={10} />
          </button>
        </div>
      </div>

      {/* Subtotal row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <MessageSquare size={10} />
          <span>{item.notes ? 'Edit catatan' : 'Tambah catatan'}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{formatCurrency(item.subtotal)}</span>
          <button
            onClick={() => removeItem(item.id)}
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Notes input */}
      {showNotes && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Contoh: es batu dikit, less sugar..."
            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && saveNotes()}
          />
          <button
            onClick={saveNotes}
            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-white text-xs transition-colors"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
