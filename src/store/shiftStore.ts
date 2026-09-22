import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Shift, ShiftSummary } from '../types';

interface ShiftStore {
  currentShift: Shift | null;
  isLoading: boolean;

  fetchCurrentShift: (cashierId: string) => Promise<void>;
  openShift: (cashierId: string, cashierName: string, openingCash: number) => Promise<void>;
  getSummary: (shiftId: string, openingCash: number) => Promise<ShiftSummary>;
  closeShift: (actualCash: number, notes?: string) => Promise<ShiftSummary & { closingCash: number; difference: number }>;
  addCashFlow: (type: 'in' | 'out', amount: number, description: string) => Promise<void>;
  clearShift: () => void;
}

async function computeSummary(shiftId: string, openingCash: number): Promise<ShiftSummary> {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount, payment_method')
    .eq('shift_id', shiftId)
    .eq('status', 'completed');
  if (error) throw error;

  const orders = data ?? [];
  const sumBy = (method: string) =>
    orders.filter((o) => o.payment_method === method).reduce((s, o) => s + (o.total_amount ?? 0), 0);

  const { data: flowsData, error: flowsError } = await supabase
    .from('shift_cash_flows')
    .select('type, amount')
    .eq('shift_id', shiftId);
  if (flowsError) throw flowsError;

  const flows = flowsData ?? [];
  const cashIn = flows.filter(f => f.type === 'in').reduce((s, f) => s + f.amount, 0);
  const cashOut = flows.filter(f => f.type === 'out').reduce((s, f) => s + f.amount, 0);

  const cashTotal = sumBy('cash');
  const qrisTotal = sumBy('qris');
  const transferTotal = sumBy('transfer');
  const grandTotal = cashTotal + qrisTotal + transferTotal;

  return {
    totalOrders: orders.length,
    cashTotal,
    qrisTotal,
    transferTotal,
    grandTotal,
    expectedCash: openingCash + cashTotal + cashIn - cashOut,
  };
}

export const useShiftStore = create<ShiftStore>((set, get) => ({
  currentShift: null,
  isLoading: false,

  fetchCurrentShift: async (cashierId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('cashier_id', cashierId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      set({ currentShift: data ?? null });
    } catch (err) {
      console.error('Failed to fetch current shift:', err);
      set({ currentShift: null });
    } finally {
      set({ isLoading: false });
    }
  },

  openShift: async (cashierId, cashierName, openingCash) => {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        cashier_id: cashierId,
        cashier_name: cashierName,
        status: 'open',
        opening_cash: openingCash,
      })
      .select()
      .single();
    if (error) throw error;
    set({ currentShift: data });
  },

  getSummary: async (shiftId, openingCash) => {
    return computeSummary(shiftId, openingCash);
  },

  closeShift: async (actualCash, notes) => {
    const shift = get().currentShift;
    if (!shift) throw new Error('Tidak ada shift yang sedang berjalan');

    const summary = await computeSummary(shift.id, shift.opening_cash);
    const difference = actualCash - summary.expectedCash;

    const { error } = await supabase
      .from('shifts')
      .update({
        status: 'closed',
        closing_cash: actualCash,
        expected_cash: summary.expectedCash,
        cash_difference: difference,
        notes: notes || null,
        closed_at: new Date().toISOString(),
      })
      .eq('id', shift.id);
    if (error) throw error;

    set({ currentShift: null });
    return { ...summary, closingCash: actualCash, difference };
  },

  addCashFlow: async (type, amount, description) => {
    const shift = get().currentShift;
    if (!shift) throw new Error('Tidak ada shift yang sedang berjalan');
    if (!shift.cashier_id) throw new Error('Cashier ID tidak valid');

    const { error } = await supabase
      .from('shift_cash_flows')
      .insert({
        shift_id: shift.id,
        cashier_id: shift.cashier_id,
        type,
        amount,
        description,
      });
    if (error) throw error;
  },

  clearShift: () => set({ currentShift: null }),
}));
