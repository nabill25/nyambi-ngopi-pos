import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ModifierGroup, ModifierSelectionType } from '../types';

export function useProductModifiers(productId: string | null) {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!productId) { setGroups([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('product_modifier_groups')
        .select('*, options:product_modifiers(*)')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const sorted = (data ?? []).map((g) => ({
        ...g,
        options: (g.options ?? []).slice().sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
      }));
      setGroups(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat varian');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, selectionType: ModifierSelectionType, isRequired: boolean) => {
    if (!productId) return;
    const { error } = await supabase.from('product_modifier_groups').insert({
      product_id: productId,
      name,
      selection_type: selectionType,
      is_required: isRequired,
      sort_order: groups.length,
    });
    if (error) throw error;
    await fetchGroups();
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase.from('product_modifier_groups').delete().eq('id', groupId);
    if (error) throw error;
    await fetchGroups();
  };

  const addOption = async (groupId: string, name: string, priceDelta: number) => {
    const group = groups.find((g) => g.id === groupId);
    const { error } = await supabase.from('product_modifiers').insert({
      group_id: groupId,
      name,
      price_delta: priceDelta,
      sort_order: group?.options?.length ?? 0,
    });
    if (error) throw error;
    await fetchGroups();
  };

  const deleteOption = async (optionId: string) => {
    const { error } = await supabase.from('product_modifiers').delete().eq('id', optionId);
    if (error) throw error;
    await fetchGroups();
  };

  return { groups, isLoading, error, createGroup, deleteGroup, addOption, deleteOption };
}
