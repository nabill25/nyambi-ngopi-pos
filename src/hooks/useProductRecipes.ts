import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ProductRecipe } from '../types';
import { toast } from 'sonner';

export function useProductRecipes(productId: string | null) {
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('product_recipes')
        .select('*, raw_material:raw_materials(*)')
        .eq('product_id', productId)
        .order('created_at');
      
      if (err) throw err;
      setRecipes(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat resep produk');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const addRecipe = async (rawMaterialId: string, quantityRequired: number) => {
    if (!productId) return;
    try {
      const { data, error } = await supabase
        .from('product_recipes')
        .insert([{ 
          product_id: productId, 
          raw_material_id: rawMaterialId, 
          quantity_required: quantityRequired 
        }])
        .select('*, raw_material:raw_materials(*)')
        .single();
      
      if (error) throw error;
      setRecipes(prev => [...prev, data]);
      toast.success('Bahan resep ditambahkan');
    } catch (err) {
      toast.error('Gagal menambah resep');
      throw err;
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const { error } = await supabase.from('product_recipes').delete().eq('id', id);
      if (error) throw error;
      setRecipes(prev => prev.filter(r => r.id !== id));
      toast.success('Bahan resep dihapus');
    } catch (err) {
      toast.error('Gagal menghapus resep');
      throw err;
    }
  };

  return {
    recipes,
    isLoading,
    error,
    addRecipe,
    deleteRecipe
  };
}
