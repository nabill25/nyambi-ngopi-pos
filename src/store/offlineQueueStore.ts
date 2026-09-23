import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, OrderItem, PaymentMethod } from '../types';

// Baris "orders" yang sudah lengkap dihitung (subtotal/pajak/total/dll) di
// saat transaksi terjadi — dibuat sekali di sisi klien, lalu dikirim apa
// adanya ke server (baik langsung, atau belakangan saat sinkron), supaya
// nominal yang sudah diserahkan ke pelanggan tidak pernah berubah.
export interface ResolvedOrderPayload {
  id: string;
  order_number: string;
  cashier_id: string | null;
  cashier_name: string;
  shift_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  status: 'completed';
  payment_method: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  promo_code: string | null;
  promo_name: string | null;
  points_earned: number;
  points_redeemed: number;
  points_discount_amount: number;
  tax_amount: number;
  tax_percent: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  notes: string | null;
  created_at: string;
}

export interface QueuedOrder {
  id: string;
  orderPayload: ResolvedOrderPayload;
  itemsPayload: OrderItem[];
  items: CartItem[]; // dibutuhkan saat sinkron untuk potong stok
  queuedAt: string;
}

interface OfflineQueueStore {
  queue: QueuedOrder[];
  isSyncing: boolean;
  lastSyncError: string | null;
  enqueue: (order: QueuedOrder) => void;
  dequeue: (id: string) => void;
  setSyncing: (value: boolean) => void;
  setSyncError: (message: string | null) => void;
}

export const useOfflineQueueStore = create<OfflineQueueStore>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,
      lastSyncError: null,
      enqueue: (order) => set((state) => ({ queue: [...state.queue, order] })),
      dequeue: (id) => set((state) => ({ queue: state.queue.filter((o) => o.id !== id) })),
      setSyncing: (value) => set({ isSyncing: value }),
      setSyncError: (message) => set({ lastSyncError: message }),
    }),
    { name: 'offline-queue-storage' }
  )
);
