import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Customer, CustomerStats } from '../types';

export function useCustomers(search = '') {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from('customers').select('*').order('full_name', { ascending: true });
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      setCustomers(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pelanggan');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const createCustomer = async (data: Pick<Customer, 'full_name' | 'phone' | 'email' | 'notes'>) => {
    const { data: created, error } = await supabase.from('customers').insert(data).select().single();
    if (error) throw error;
    await fetchCustomers();
    return created as Customer;
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const { error } = await supabase.from('customers').update(data).eq('id', id);
    if (error) throw error;
    await fetchCustomers();
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    await fetchCustomers();
  };

  return { customers, isLoading, error, refetch: fetchCustomers, createCustomer, updateCustomer, deleteCustomer };
}

export async function getCustomerStats(customerId: string): Promise<CustomerStats> {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .eq('customer_id', customerId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const orders = data ?? [];
  return {
    totalOrders: orders.length,
    totalSpent: orders.reduce((s, o) => s + (o.total_amount ?? 0), 0),
    lastVisit: orders[0]?.created_at ?? null,
  };
}
