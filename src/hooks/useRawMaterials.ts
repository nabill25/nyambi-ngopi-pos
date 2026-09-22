import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RawMaterial } from '../types';
import { toast } from 'sonner';
import { saveCache, loadCache, isNetworkError } from '../lib/offlineCache';

const CACHE_KEY = 'raw_materials';

export function useRawMaterials() {
  const initialCache = loadCache<RawMaterial[]>(CACHE_KEY) ?? [];
  const [materials, setMaterials] = useState<RawMaterial[]>(initialCache);
  const [isLoading, setIsLoading] = useState(initialCache.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('raw_materials')
        .select('*')
        .order('name');
      
      if (err) throw err;
      setMaterials(data ?? []);
      saveCache(CACHE_KEY, data ?? []);
    } catch (err) {
      const cached = loadCache<RawMaterial[]>(CACHE_KEY);
      if (isNetworkError(err) && cached) {
        setMaterials(cached);
      } else {
        setError(err instanceof Error ? err.message : 'Gagal memuat data bahan baku');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasCache = (loadCache<RawMaterial[]>(CACHE_KEY)?.length ?? 0) > 0;
    fetchMaterials(hasCache);
  }, [fetchMaterials]);

  const addMaterial = async (material: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .insert([{ ...material, updated_at: new Date().toISOString() }])
        .select()
        .single();
      
      if (error) throw error;
      setMaterials(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Bahan baku berhasil ditambahkan');
      return data;
    } catch (err) {
      toast.error('Gagal menambah bahan baku');
      throw err;
    }
  };

  const updateMaterial = async (id: string, updates: Partial<RawMaterial>) => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setMaterials(prev => prev.map(m => m.id === id ? data : m));
      toast.success('Data bahan baku diperbarui');
      return data;
    } catch (err) {
      toast.error('Gagal memperbarui bahan baku');
      throw err;
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase.from('raw_materials').delete().eq('id', id);
      if (error) throw error;
      setMaterials(prev => prev.filter(m => m.id !== id));
      toast.success('Bahan baku dihapus');
    } catch (err) {
      toast.error('Gagal menghapus bahan baku');
      throw err;
    }
  };

  return {
    materials,
    isLoading,
    error,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    refresh: fetchMaterials
  };
}
