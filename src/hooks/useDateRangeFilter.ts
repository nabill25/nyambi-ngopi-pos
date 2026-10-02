import { useState, useCallback } from 'react';
import { getDateRange } from '../lib/utils';
import { DateRange } from '../types';

export interface DateWindow {
  start: Date;
  end: Date;
}

// State filter periode (Hari Ini / 7 Hari / Bulan Ini / Kustom) yang dipakai halaman Laporan & Transaksi.
// getCurrentRange dihitung saat dipanggil, jadi "Hari Ini" selalu mengikuti jam sekarang.
export function useDateRangeFilter(initial: DateRange = 'today') {
  const [selectedRange, setSelectedRange] = useState<DateRange>(initial);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getCurrentRange = useCallback((): DateWindow | null => {
    if (selectedRange === 'custom') {
      if (!customStart || !customEnd) return null;
      return { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T23:59:59`) };
    }
    return getDateRange(selectedRange);
  }, [selectedRange, customStart, customEnd]);

  return { selectedRange, setSelectedRange, customStart, setCustomStart, customEnd, setCustomEnd, getCurrentRange };
}
