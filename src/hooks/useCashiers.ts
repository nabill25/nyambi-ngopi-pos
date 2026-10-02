import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CashierOption } from '../types';

// Daftar akun (kasir/admin/owner) untuk filter laporan & transaksi. enabled=false: tidak mengambil data
// (akun kasir tidak memakai filter ini). Sengaja hanya memilih kolom yang dibutuhkan — jangan ambil
// kolom pin dari tabel profiles.
export function useCashiers(enabled = true) {
  const [cashiers, setCashiers] = useState<CashierOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('id, full_name, role, is_active')
          .order('full_name', { ascending: true });
        if (cancelled) return;
        if (queryError) throw queryError;
        setCashiers((data ?? []) as CashierOption[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat daftar kasir');
      }
    })();

    return () => { cancelled = true; };
  }, [enabled]);

  const nameById = useMemo(() => new Map(cashiers.map((c) => [c.id, c.full_name])), [cashiers]);

  return { cashiers, nameById, error };
}
