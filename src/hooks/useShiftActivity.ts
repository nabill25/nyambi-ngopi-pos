import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Shift, ShiftCashFlow } from '../types';
import { DateWindow } from './useDateRangeFilter';
import { useTableChanges } from './useTableChanges';

const MAX_SHIFTS = 500;
const MAX_CASH_FLOWS = 1000;

// Shift (laporan tutup kasir) dan kas keluar/masuk laci dari semua akun kasir pada periode laporan.
// cashierId = null berarti semua akun. Data dimuat ulang otomatis saat ada perubahan di tabel terkait.
export function useShiftActivity(getRange: () => DateWindow | null, cashierId: string | null) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [cashFlows, setCashFlows] = useState<ShiftCashFlow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const refetch = useCallback(async () => {
    const range = getRange();
    if (!range) {
      setShifts([]);
      setCashFlows([]);
      return;
    }

    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setError(null);

    const start = range.start.toISOString();
    const end = range.end.toISOString();

    try {
      let shiftQuery = supabase
        .from('shifts')
        .select('*')
        .gte('opened_at', start)
        .lte('opened_at', end)
        .order('opened_at', { ascending: false })
        .limit(MAX_SHIFTS);
      let flowQuery = supabase
        .from('shift_cash_flows')
        .select('id, shift_id, cashier_id, type, amount, description, created_at')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(MAX_CASH_FLOWS);
      if (cashierId) {
        shiftQuery = shiftQuery.eq('cashier_id', cashierId);
        flowQuery = flowQuery.eq('cashier_id', cashierId);
      }

      const [shiftResult, flowResult] = await Promise.all([shiftQuery, flowQuery]);
      if (requestId !== latestRequest.current) return; // ada permintaan yang lebih baru
      if (shiftResult.error) throw shiftResult.error;
      if (flowResult.error) throw flowResult.error;

      setShifts((shiftResult.data ?? []) as Shift[]);
      setCashFlows((flowResult.data ?? []) as ShiftCashFlow[]);
    } catch (err) {
      if (requestId === latestRequest.current) {
        setError(err instanceof Error ? err.message : 'Gagal memuat laporan shift & kas laci');
      }
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [getRange, cashierId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useTableChanges(['shifts', 'shift_cash_flows'], refetch);

  return { shifts, cashFlows, isLoading, error, refetch };
}
