import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { saveCache, loadCache, isNetworkError } from '../lib/offlineCache';

const CACHE_KEY = 'products';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => loadCache<Product[]>(CACHE_KEY) ?? []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), modifier_groups:product_modifier_groups(*, options:product_modifiers(*))')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;

      // Sort nested modifier groups/options client-side — more reliable than
      // relying on PostgREST's nested foreignTable ordering syntax.
      const sorted = (data ?? []).map((p) => ({
        ...p,
        modifier_groups: (p.modifier_groups ?? [])
          .map((g: { options?: { sort_order: number }[] }) => ({
            ...g,
            options: (g.options ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
          }))
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
      }));

      setProducts(sorted);
      setIsFromCache(false);
      saveCache(CACHE_KEY, sorted);
    } catch (err) {
      // Offline/koneksi bermasalah: tetap tampilkan menu dari cache terakhir
      // supaya kasir tetap bisa jualan, alih-alih layar kosong/error.
      const cached = loadCache<Product[]>(CACHE_KEY);
      if (isNetworkError(err) && cached) {
        setProducts(cached);
        setIsFromCache(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    // Realtime subscription
    const channel = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    await fetchProducts();
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    await fetchProducts();
    return data;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await fetchProducts();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateProduct(id, { is_active: isActive });
  };

  return {
    products,
    isLoading,
    error,
    isFromCache,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
  };
}
