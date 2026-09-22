import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Promotion } from '../types';
import { saveCache, loadCache, isNetworkError } from '../lib/offlineCache';

const CACHE_KEY = 'promotions';

export function usePromotions() {
  const initialCache = loadCache<Promotion[]>(CACHE_KEY) ?? [];
  const [promotions, setPromotions] = useState<Promotion[]>(initialCache);
  const [isLoading, setIsLoading] = useState(initialCache.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setPromotions(data ?? []);
      saveCache(CACHE_KEY, data ?? []);
    } catch (err) {
      const cached = loadCache<Promotion[]>(CACHE_KEY);
      if (isNetworkError(err) && cached) {
        setPromotions(cached);
      } else {
        setError(err instanceof Error ? err.message : 'Gagal memuat promo');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasCache = (loadCache<Promotion[]>(CACHE_KEY)?.length ?? 0) > 0;
    fetchPromotions(hasCache);

    const channelName = `promotions_changes_${Date.now()}`;
    const channel = supabase.channel(channelName);
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        fetchPromotions(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPromotion = async (data: Omit<Promotion, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('promotions').insert(data);
    if (error) throw error;
    await fetchPromotions();
  };

  const updatePromotion = async (id: string, data: Partial<Promotion>) => {
    const { error } = await supabase.from('promotions').update(data).eq('id', id);
    if (error) throw error;
    await fetchPromotions();
  };

  const deletePromotion = async (id: string) => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;
    await fetchPromotions();
  };

  return { promotions, isLoading, error, createPromotion, updatePromotion, deletePromotion };
}

/** Whether a promotion is currently within its active date range. */
export function isPromoInDateRange(promo: Promotion, now: Date = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  if (promo.start_date && today < promo.start_date) return false;
  if (promo.end_date && today > promo.end_date) return false;
  return true;
}

/** Promotions eligible right now for a given subtotal, without needing a code. */
export function getAutoPromotions(promotions: Promotion[], subtotal: number): Promotion[] {
  return promotions.filter(
    (p) => p.is_active && !p.code && subtotal >= p.min_purchase && isPromoInDateRange(p)
  );
}

/** Validates a manually-entered promo code against the subtotal. Returns an error message, or null if valid. */
export function validatePromoCode(promo: Promotion | undefined, subtotal: number): string | null {
  if (!promo) return 'Kode promo tidak ditemukan';
  if (!promo.is_active) return 'Promo ini sudah tidak aktif';
  if (!isPromoInDateRange(promo)) return 'Promo ini sudah tidak berlaku';
  if (subtotal < promo.min_purchase) return `Minimal belanja Rp${promo.min_purchase.toLocaleString('id-ID')}`;
  return null;
}
