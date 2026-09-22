import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoreSettings } from '../types';
import { supabase } from '../lib/supabase';

const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'Nyambi Ngopi',
  store_address: 'Depok, Jawa Barat',
  store_phone: '',
  store_instagram: '@nyambi.ngopi',
  receipt_footer: 'Terima kasih sudah mampir! ☕',
  tax_enabled: false,
  tax_percent: 0,
  tax_label: 'PB1',
  currency: 'IDR',
  receipt_paper_size: '80mm',
  printer_name: '',
  loyalty_enabled: false,
  loyalty_earn_rate: 10000,
  loyalty_redeem_rate: 100,
};

interface SettingsStore {
  settings: StoreSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<StoreSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,

      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('settings')
            .select('key, value');
          if (error) throw error;

          const map: Partial<StoreSettings> = {};
          (data ?? []).forEach((row) => {
            const key = row.key as keyof StoreSettings;
            if (key === 'tax_enabled' || key === 'loyalty_enabled') {
              (map as Record<string, unknown>)[key] = row.value === 'true';
            } else if (key === 'tax_percent' || key === 'loyalty_earn_rate' || key === 'loyalty_redeem_rate') {
              (map as Record<string, unknown>)[key] = parseFloat(row.value ?? '0');
            } else {
              (map as Record<string, unknown>)[key] = row.value ?? '';
            }
          });

          set({ settings: { ...DEFAULT_SETTINGS, ...map } });
        } catch (err) {
          console.error('Failed to fetch settings:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      updateSettings: async (updates) => {
        const current = get().settings;
        const newSettings = { ...current, ...updates };
        set({ settings: newSettings });

        // Persist to Supabase
        const rows = Object.entries(updates).map(([key, value]) => ({
          key,
          value: String(value),
        }));

        try {
          for (const row of rows) {
            await supabase
              .from('settings')
              .upsert({ key: row.key, value: row.value }, { onConflict: 'key' });
          }
        } catch (err) {
          console.error('Failed to update settings:', err);
          // Revert
          set({ settings: current });
        }
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
