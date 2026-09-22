import { create } from 'zustand';
import { CartItem, Product, SelectedModifier } from '../types';

interface CartStore {
  items: CartItem[];
  discountPercent: number;
  discountAmount: number;
  notes: string;
  customerId: string | null;
  customerName: string | null;
  customerPoints: number;
  pointsToRedeem: number;
  promoCode: string | null;
  promoName: string | null;

  // Actions
  addItem: (product: Product, selectedModifiers?: SelectedModifier[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemDiscount: (itemId: string, percent: number, amount: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  setDiscount: (percent: number, amount: number, promoCode?: string | null, promoName?: string | null) => void;
  setNotes: (notes: string) => void;
  setCustomer: (customerId: string | null, customerName: string | null, customerPoints?: number) => void;
  setPointsToRedeem: (points: number) => void;
  clearCart: () => void;
  loadCart: (items: CartItem[], discountPercent: number, discountAmount: number, notes: string) => void;

  // Computed
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

function modifierSignature(modifiers?: SelectedModifier[]): string {
  return (modifiers ?? []).map((m) => m.modifier_id).sort().join(',');
}

function unitPrice(item: Pick<CartItem, 'product' | 'selectedModifiers'>): number {
  const modifiersTotal = (item.selectedModifiers ?? []).reduce((s, m) => s + m.price_delta, 0);
  return item.product.price + modifiersTotal;
}

function computeItemSubtotal(item: CartItem): number {
  const base = unitPrice(item) * item.quantity;
  let discount = 0;
  if (item.discount_percent > 0) {
    discount = Math.round(base * (item.discount_percent / 100));
  } else {
    discount = item.discount_amount * item.quantity;
  }
  return Math.max(0, base - discount);
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discountPercent: 0,
  discountAmount: 0,
  notes: '',
  customerId: null,
  customerName: null,
  customerPoints: 0,
  pointsToRedeem: 0,
  promoCode: null,
  promoName: null,

  addItem: (product, selectedModifiers = []) => {
    set((state) => {
      const signature = modifierSignature(selectedModifiers);
      const existing = state.items.find(
        (i) => i.product.id === product.id && modifierSignature(i.selectedModifiers) === signature
      );
      if (existing) {
        const updated = state.items.map((i) => {
          if (i.id === existing.id) {
            const newItem = { ...i, quantity: i.quantity + 1 };
            newItem.subtotal = computeItemSubtotal(newItem);
            return newItem;
          }
          return i;
        });
        return { items: updated };
      }
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        product,
        quantity: 1,
        notes: '',
        discount_percent: 0,
        discount_amount: 0,
        subtotal: 0,
        selectedModifiers,
      };
      newItem.subtotal = computeItemSubtotal(newItem);
      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) => {
        if (i.id === itemId) {
          const newItem = { ...i, quantity };
          newItem.subtotal = computeItemSubtotal(newItem);
          return newItem;
        }
        return i;
      }),
    }));
  },

  updateItemDiscount: (itemId, percent, amount) => {
    set((state) => ({
      items: state.items.map((i) => {
        if (i.id === itemId) {
          const newItem = { ...i, discount_percent: percent, discount_amount: amount };
          newItem.subtotal = computeItemSubtotal(newItem);
          return newItem;
        }
        return i;
      }),
    }));
  },

  updateItemNotes: (itemId, notes) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, notes } : i
      ),
    }));
  },

  setDiscount: (percent, amount, promoCode = null, promoName = null) => {
    set({ discountPercent: percent, discountAmount: amount, promoCode, promoName });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  setCustomer: (customerId, customerName, customerPoints = 0) => {
    set({ customerId, customerName, customerPoints, pointsToRedeem: 0 });
  },

  setPointsToRedeem: (points) => {
    set({ pointsToRedeem: Math.max(0, points) });
  },

  clearCart: () => {
    set({ items: [], discountPercent: 0, discountAmount: 0, notes: '', customerId: null, customerName: null, customerPoints: 0, pointsToRedeem: 0, promoCode: null, promoName: null });
  },

  loadCart: (items, discountPercent, discountAmount, notes) => {
    set({ items, discountPercent, discountAmount, notes });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotalDiscount: () => {
    const subtotal = get().getSubtotal();
    const { discountPercent, discountAmount } = get();
    if (discountPercent > 0) {
      return Math.round(subtotal * (discountPercent / 100));
    }
    return discountAmount;
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getTotalDiscount();
    return Math.max(0, subtotal - discount);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
