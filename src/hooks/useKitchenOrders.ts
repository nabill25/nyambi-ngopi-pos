import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order, KitchenStatus } from '../types';
import { toast } from 'sonner';

let globalOrdersCache: Order[] = [];
let hasFetchedOrders = false;

export function useKitchenOrders() {
  const [orders, setOrders] = useState<Order[]>(globalOrdersCache);
  const [isLoading, setIsLoading] = useState(!hasFetchedOrders);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .neq('status', 'cancelled')
        .neq('kitchen_status', 'delivered')
        .order('created_at', { ascending: true }); // Oldest first for kitchen
      
      if (err) throw err;
      const fetched = data ?? [];
      globalOrdersCache = fetched;
      hasFetchedOrders = true;
      setOrders(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pesanan dapur');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(hasFetchedOrders);

    // Subscribe to real-time changes
    const channel = supabase
      .channel('realtime_kitchen_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New order created
            const newOrder = payload.new as Order;
            if (newOrder.status !== 'cancelled' && newOrder.kitchen_status !== 'delivered') {
              // We need to fetch the order_items for this new order
              supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', newOrder.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    // Play notification sound for new order
                    try {
                      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/doorbell.ogg');
                      audio.play().catch(e => console.log('Audio autoplay blocked', e));
                    } catch (err) {
                      console.log('Error playing sound', err);
                    }

                    setOrders(prev => {
                      if (prev.find(o => o.id === data.id)) return prev;
                      return [...prev, data];
                    });
                  }
                });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            if (updated.status === 'cancelled' || updated.kitchen_status === 'delivered') {
              // Remove from KDS
              setOrders(prev => prev.filter(o => o.id !== updated.id));
            } else {
              // Update in place, but we need order_items. Usually items don't change after creation.
              setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, kitchen_status: updated.kitchen_status, status: updated.status } : o));
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateKitchenStatus = async (orderId: string, newStatus: KitchenStatus) => {
    try {
      // Optimistic update
      setOrders(prev => {
        if (newStatus === 'delivered') return prev.filter(o => o.id !== orderId);
        return prev.map(o => o.id === orderId ? { ...o, kitchen_status: newStatus } : o);
      });

      const { error } = await supabase
        .from('orders')
        .update({ kitchen_status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
    } catch (err) {
      toast.error('Gagal memperbarui status dapur');
      // Revert will happen automatically upon next fetch or real-time event if it fails (simplification)
      fetchOrders(); 
      throw err;
    }
  };

  return {
    orders,
    isLoading,
    error,
    updateKitchenStatus,
    refresh: fetchOrders
  };
}
