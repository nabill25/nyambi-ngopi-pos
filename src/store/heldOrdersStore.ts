import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types';

export interface HeldOrder {
  id: string;
  label: string;
  items: CartItem[];
  discountPercent: number;
  discountAmount: number;
  notes: string;
  heldAt: string;
}

interface HeldOrdersStore {
  heldOrders: HeldOrder[];
  holdOrder: (label: string, items: CartItem[], discountPercent: number, discountAmount: number, notes: string) => void;
  removeHeldOrder: (id: string) => void;
}

// Held orders are device-local (like a physical order slip on the counter) —
// no server round-trip needed, and persisted so they survive an accidental refresh.
export const useHeldOrdersStore = create<HeldOrdersStore>()(
  persist(
    (set) => ({
      heldOrders: [],

      holdOrder: (label, items, discountPercent, discountAmount, notes) => {
        const heldOrder: HeldOrder = {
          id: crypto.randomUUID(),
          label,
          items,
          discountPercent,
          discountAmount,
          notes,
          heldAt: new Date().toISOString(),
        };
        set((state) => ({ heldOrders: [heldOrder, ...state.heldOrders] }));
      },

      removeHeldOrder: (id) => {
        set((state) => ({ heldOrders: state.heldOrders.filter((o) => o.id !== id) }));
      },
    }),
    { name: 'held-orders-storage' }
  )
);
