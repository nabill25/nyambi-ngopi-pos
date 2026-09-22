import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getStockStatus } from '../lib/utils';

interface StockAlertProduct {
  id: string;
  name: string;
  stock_quantity: number | null;
  low_stock_threshold: number;
}

export function useLowStockAlert() {
  const [lowStock, setLowStock] = useState<StockAlertProduct[]>([]);
  const [outOfStock, setOutOfStock] = useState<StockAlertProduct[]>([]);

  const fetchStock = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold, track_stock')
      .eq('is_active', true)
      .eq('track_stock', true);
    if (error || !data) return;

    const low: StockAlertProduct[] = [];
    const out: StockAlertProduct[] = [];
    data.forEach((p) => {
      const status = getStockStatus(p);
      if (status === 'low') low.push(p);
      else if (status === 'out') out.push(p);
    });
    setLowStock(low);
    setOutOfStock(out);
  }, []);

  useEffect(() => {
    fetchStock();

    const channel = supabase
      .channel('low_stock_alert_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchStock)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStock]);

  return { lowStock, outOfStock, totalAlerts: lowStock.length + outOfStock.length };
}
