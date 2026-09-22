import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Shift } from '../types';
import { useAuthStore } from '../store/authStore';

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuthStore();

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from('shifts').select('*').order('opened_at', { ascending: false }).limit(50);
      if (!isAdmin && profile?.id) {
        query = query.eq('cashier_id', profile.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setShifts(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat riwayat shift');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, profile?.id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return { shifts, isLoading, error, refetch: fetchShifts };
}
