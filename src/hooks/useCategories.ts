import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import { saveCache, loadCache, isNetworkError } from '../lib/offlineCache';

const CACHE_KEY = 'categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => loadCache<Category[]>(CACHE_KEY) ?? []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setCategories(data ?? []);
      saveCache(CACHE_KEY, data ?? []);
    } catch (err) {
      const cached = loadCache<Category[]>(CACHE_KEY);
      if (isNetworkError(err) && cached) {
        setCategories(cached);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    const channelName = `categories_changes_${Date.now()}`;
    const channel = supabase.channel(channelName);
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCategory = async (category: Pick<Category, 'name' | 'icon' | 'color' | 'sort_order'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    if (error) throw error;
    await fetchCategories();
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await fetchCategories();
    return data;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    await fetchCategories();
  };

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
