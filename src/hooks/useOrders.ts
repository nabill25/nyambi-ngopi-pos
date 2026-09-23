import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderItem, CartItem, PaymentMethod } from '../types';
import { generateOrderNumber } from '../lib/utils';
import { isNetworkError } from '../lib/offlineCache';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useShiftStore } from '../store/shiftStore';
import { useOfflineQueueStore, ResolvedOrderPayload } from '../store/offlineQueueStore';

interface CreateOrderParams {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discountPercent: number;
  discountAmount: number;
  paidAmount: number;
  notes?: string;
  customerId?: string | null;
  customerName?: string | null;
  promoCode?: string | null;
  promoName?: string | null;
  pointsToRedeem?: number;
}

// Satu-satunya tempat yang benar-benar menulis ke Supabase untuk sebuah
// transaksi. Dipakai baik saat submit langsung (online) maupun belakangan
// saat sinkronisasi antrean offline — supaya kedua jalur tidak pernah beda logika.
async function submitToServer(
  orderPayload: ResolvedOrderPayload,
  itemsPayload: OrderItem[],
  items: CartItem[]
): Promise<Order> {
  const { error: orderError } = await supabase.from('orders').insert(orderPayload);
  if (orderError) throw orderError;

  if (orderPayload.customer_id && (orderPayload.points_earned > 0 || orderPayload.points_redeemed > 0)) {
    const { data: customerRow } = await supabase
      .from('customers')
      .select('loyalty_points')
      .eq('id', orderPayload.customer_id)
      .single();
    const currentBalance = customerRow?.loyalty_points ?? 0;
    const newBalance = Math.max(0, currentBalance - orderPayload.points_redeemed + orderPayload.points_earned);
    await supabase.from('customers').update({ loyalty_points: newBalance }).eq('id', orderPayload.customer_id);
  }

  const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
  if (itemsError) throw itemsError;

  // Manajemen Stok: Deduct stock
  for (const item of items) {
    if (item.product.track_stock && item.product.stock_quantity != null) {
      await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, item.product.stock_quantity - item.quantity) })
        .eq('id', item.product.id);
    }
  }

  return { ...orderPayload, updated_at: orderPayload.created_at, order_items: itemsPayload };
}

// Coba kirim semua transaksi offline yang tertunda, berurutan. Berhenti di
// item pertama yang gagal (masih offline, atau error lain) supaya urutan
// transaksi tetap terjaga dan tidak ada yang terlewat diam-diam.
export async function syncOfflineQueue() {
  const store = useOfflineQueueStore.getState();
  if (store.isSyncing || store.queue.length === 0 || !navigator.onLine) return;

  store.setSyncing(true);
  store.setSyncError(null);
  try {
    for (const queued of store.queue) {
      try {
        await submitToServer(queued.orderPayload, queued.itemsPayload, queued.items);
        useOfflineQueueStore.getState().dequeue(queued.id);
      } catch (err) {
        if (!isNetworkError(err)) {
          store.setSyncError(err instanceof Error ? err.message : 'Gagal menyinkronkan transaksi offline');
        }
        break;
      }
    }
  } finally {
    useOfflineQueueStore.getState().setSyncing(false);
  }
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuthStore();
  const { settings } = useSettingsStore();
  const { currentShift } = useShiftStore();
  const enqueueOffline = useOfflineQueueStore((s) => s.enqueue);

  const fetchOrders = useCallback(async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setOrders(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTodayOrders = useCallback(async () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    await fetchOrders(start, end);
  }, [fetchOrders]);

  const createOrder = async (params: CreateOrderParams): Promise<Order> => {
    const { items, paymentMethod, discountPercent, discountAmount, paidAmount, notes, customerId, customerName, promoCode, promoName, pointsToRedeem } = params;

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    let totalDiscount = discountAmount;
    if (discountPercent > 0) {
      totalDiscount = Math.round(subtotal * (discountPercent / 100));
    }

    const taxEnabled = settings.tax_enabled;
    const taxPercent = settings.tax_percent;
    const afterDiscount = Math.max(0, subtotal - totalDiscount);
    const taxAmount = taxEnabled ? Math.round(afterDiscount * (taxPercent / 100)) : 0;
    const totalBeforePoints = afterDiscount + taxAmount;

    // Poin loyalitas butuh saldo terkini dari server, jadi hanya dicoba saat
    // online. Saat offline, transaksi tetap jalan sebagai penjualan biasa
    // tanpa poin (kasir sudah diberi tahu di layar pembayaran).
    let pointsRedeemed = 0;
    let pointsDiscount = 0;
    const loyaltyRequested = !!customerId && settings.loyalty_enabled;
    if (loyaltyRequested && navigator.onLine) {
      try {
        const { data: customerRow } = await supabase.from('customers').select('loyalty_points').eq('id', customerId!).single();
        const customerLoyaltyPoints = customerRow?.loyalty_points ?? 0;
        pointsRedeemed = Math.max(0, Math.min(pointsToRedeem ?? 0, customerLoyaltyPoints));
        pointsDiscount = pointsRedeemed * settings.loyalty_redeem_rate;
        if (pointsDiscount > totalBeforePoints) {
          pointsDiscount = totalBeforePoints;
          pointsRedeemed = settings.loyalty_redeem_rate > 0 ? Math.floor(pointsDiscount / settings.loyalty_redeem_rate) : 0;
        }
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        // koneksi putus persis di sini — lanjut sebagai transaksi offline tanpa poin
      }
    }

    const totalAmount = Math.max(0, totalBeforePoints - pointsDiscount);
    const pointsEarned = loyaltyRequested && settings.loyalty_earn_rate > 0 ? Math.floor(totalAmount / settings.loyalty_earn_rate) : 0;
    const changeAmount = paymentMethod === 'cash' ? Math.max(0, paidAmount - totalAmount) : 0;

    const orderId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const orderPayload: ResolvedOrderPayload = {
      id: orderId,
      order_number: generateOrderNumber(),
      cashier_id: profile?.id ?? null,
      cashier_name: profile?.full_name ?? 'Kasir',
      shift_id: currentShift?.id ?? null,
      customer_id: customerId ?? null,
      customer_name: customerName ?? null,
      status: 'completed',
      payment_method: paymentMethod,
      subtotal,
      discount_amount: totalDiscount,
      discount_percent: discountPercent,
      promo_code: promoCode ?? null,
      promo_name: promoName ?? null,
      points_earned: pointsEarned,
      points_redeemed: pointsRedeemed,
      points_discount_amount: pointsDiscount,
      tax_amount: taxAmount,
      tax_percent: taxPercent,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      change_amount: changeAmount,
      notes: notes ?? null,
      created_at: createdAt,
    };

    const itemsPayload: OrderItem[] = items.map((item) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.price,
      product_cost: item.product.cost_price ?? 0,
      quantity: item.quantity,
      discount_amount: item.discount_amount,
      discount_percent: item.discount_percent,
      subtotal: item.subtotal,
      notes: item.notes || undefined,
      modifiers_snapshot: item.selectedModifiers && item.selectedModifiers.length > 0 ? item.selectedModifiers : null,
      created_at: createdAt,
    }));

    const queueForLater = (): Order => {
      enqueueOffline({ id: orderId, orderPayload, itemsPayload, items, queuedAt: createdAt });
      return { ...orderPayload, updated_at: createdAt, order_items: itemsPayload, synced: false };
    };

    if (!navigator.onLine) {
      return queueForLater();
    }

    try {
      const order = await submitToServer(orderPayload, itemsPayload, items);
      return { ...order, synced: true };
    } catch (err) {
      if (isNetworkError(err)) {
        return queueForLater();
      }
      throw err;
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    // Ambil data item sebelum dicancel untuk restore stok
    const { data: orderDetails } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single();

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancel_reason: reason })
      .eq('id', orderId);
    if (error) throw error;

    // Restore stok jika order dicancel
    if (orderDetails && orderDetails.order_items) {
      for (const item of orderDetails.order_items) {
        if (item.product_id) {
          const { data: product } = await supabase.from('products').select('track_stock, stock_quantity').eq('id', item.product_id).single();
          if (product && product.track_stock) {
            await supabase.from('products').update({ stock_quantity: (product.stock_quantity ?? 0) + item.quantity }).eq('id', item.product_id);
          }
        }
      }
    }
  };

  const getOrderDetail = async (orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();
    if (error) return null;
    return data;
  };

  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    fetchTodayOrders,
    createOrder,
    cancelOrder,
    getOrderDetail,
  };
}
