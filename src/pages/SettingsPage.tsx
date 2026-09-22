import { useState, useEffect } from 'react';
import { Save, Loader2, Store, Printer, Receipt, DollarSign, Shield, Gem } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';
import { StoreSettings } from '../types';
import { cn } from '../lib/utils';
import { usePrinter } from '../hooks/usePrinter';
import { SectionTitle, Field, SETTINGS_INPUT_CLASS as INPUT_CLASS } from '../components/settings/SettingsField';
import { SecurityTab } from '../components/settings/SecurityTab';

type Tab = 'store' | 'receipt' | 'tax' | 'loyalty' | 'printer' | 'security';

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: 'store', label: 'Toko', icon: Store },
  { value: 'receipt', label: 'Struk', icon: Receipt },
  { value: 'tax', label: 'Pajak', icon: DollarSign },
  { value: 'loyalty', label: 'Poin', icon: Gem },
  { value: 'printer', label: 'Printer', icon: Printer },
  { value: 'security', label: 'Keamanan', icon: Shield },
];

export function SettingsPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  const { isConnected, isConnecting, printerName, connect, disconnect, testPrint } = usePrinter();
  const [activeTab, setActiveTab] = useState<Tab>('store');
  const [form, setForm] = useState<StoreSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(form);
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 h-full overflow-y-auto" style={{ background: 'transparent' }}>
      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1 p-1 rounded-2xl relative" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)' }}>
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95',
              activeTab === value ? 'text-white' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {activeTab === value && (
              <motion.div
                layoutId="activeSettingsTab"
                className="absolute inset-0 rounded-xl"
                transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                style={{ background: 'linear-gradient(135deg,#1f9c56,#45b975)', boxShadow: '0 4px 16px rgba(31,156,86,0.35)' }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={14} />
            </span>
          </button>
        ))}
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-4 lg:p-6 space-y-4">
        <AnimatePresence mode="wait">
        {/* Store info */}
        {activeTab === 'store' && (
          <motion.div key="store" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <SectionTitle>Informasi Toko</SectionTitle>
            <Field label="Nama Toko">
              <input type="text" value={form.store_name} onChange={(e) => set('store_name', e.target.value)} className={INPUT_CLASS} placeholder="Nyambi Ngopi" />
            </Field>
            <Field label="Alamat">
              <textarea value={form.store_address} onChange={(e) => set('store_address', e.target.value)} className={cn(INPUT_CLASS, 'resize-none')} rows={2} placeholder="Jl. Contoh No. 123, Depok" />
            </Field>
            <Field label="No. Telepon">
              <input type="tel" value={form.store_phone} onChange={(e) => set('store_phone', e.target.value)} className={INPUT_CLASS} placeholder="08123456789" />
            </Field>
            <Field label="Instagram">
              <input type="text" value={form.store_instagram} onChange={(e) => set('store_instagram', e.target.value)} className={INPUT_CLASS} placeholder="@nyambi.ngopi" />
            </Field>
          </motion.div>
        )}

        {/* Receipt */}
        {activeTab === 'receipt' && (
          <motion.div key="receipt" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <SectionTitle>Pengaturan Struk</SectionTitle>
            <Field label="Pesan Footer Struk">
              <textarea value={form.receipt_footer} onChange={(e) => set('receipt_footer', e.target.value)} className={cn(INPUT_CLASS, 'resize-none')} rows={3} placeholder="Terima kasih sudah mampir! ☕" />
              <p className="text-slate-400 text-xs mt-1">Teks yang muncul di bawah struk</p>
            </Field>
            <Field label="Ukuran Kertas Struk">
              <div className="flex gap-3">
                {(['58mm', '80mm'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => set('receipt_paper_size', size)}
                    className={cn(
                      'flex-1 py-3 rounded-xl border text-sm font-medium transition-all active:scale-95',
                      form.receipt_paper_size === size
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </Field>
          </motion.div>
        )}

        {/* Tax */}
        {activeTab === 'tax' && (
          <motion.div key="tax" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <SectionTitle>Pengaturan Pajak</SectionTitle>
            <div
              className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-colors glass-card hover:bg-white/40"
              onClick={() => set('tax_enabled', !form.tax_enabled)}
            >
              <div>
                <p className="text-slate-800 font-medium text-sm">Aktifkan Pajak</p>
                <p className="text-slate-500 text-xs mt-0.5">Tambahkan pajak ke setiap transaksi</p>
              </div>
              <div className={cn('w-11 h-6 rounded-full relative transition-colors', form.tax_enabled ? 'bg-emerald-500' : 'bg-slate-50')}>
                <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.tax_enabled ? 'translate-x-5' : 'translate-x-0.5')} />
              </div>
            </div>
            {form.tax_enabled && (
              <>
                <Field label="Label Pajak">
                  <input type="text" value={form.tax_label} onChange={(e) => set('tax_label', e.target.value)} className={INPUT_CLASS} placeholder="PB1" />
                </Field>
                <Field label="Persentase Pajak (%)">
                  <input type="number" value={form.tax_percent} onChange={(e) => set('tax_percent', parseFloat(e.target.value) || 0)} min={0} max={100} className={INPUT_CLASS} placeholder="10" />
                </Field>
              </>
            )}
          </motion.div>
        )}

        {/* Loyalty points */}
        {activeTab === 'loyalty' && (
          <motion.div key="loyalty" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <SectionTitle>Poin Loyalitas / Membership</SectionTitle>
            <div
              className="flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-colors glass-card hover:bg-white/40"
              onClick={() => set('loyalty_enabled', !form.loyalty_enabled)}
            >
              <div>
                <p className="text-slate-800 font-medium text-sm">Aktifkan Poin Loyalitas</p>
                <p className="text-slate-500 text-xs mt-0.5">Pelanggan dapat poin tiap transaksi & bisa dipakai sebagai potongan</p>
              </div>
              <div className={cn('w-11 h-6 rounded-full relative transition-colors', form.loyalty_enabled ? 'bg-emerald-500' : 'bg-slate-50')}>
                <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.loyalty_enabled ? 'translate-x-5' : 'translate-x-0.5')} />
              </div>
            </div>
            {form.loyalty_enabled && (
              <>
                <Field label="Belanja untuk 1 Poin (Rp)">
                  <input type="number" value={form.loyalty_earn_rate} onChange={(e) => set('loyalty_earn_rate', parseInt(e.target.value, 10) || 0)} min={1} className={INPUT_CLASS} placeholder="10000" />
                  <p className="text-slate-400 text-xs mt-1">Contoh: 10.000 artinya tiap belanja Rp10.000 dapat 1 poin</p>
                </Field>
                <Field label="Nilai Tukar 1 Poin (Rp)">
                  <input type="number" value={form.loyalty_redeem_rate} onChange={(e) => set('loyalty_redeem_rate', parseInt(e.target.value, 10) || 0)} min={1} className={INPUT_CLASS} placeholder="100" />
                  <p className="text-slate-400 text-xs mt-1">Contoh: 100 artinya 1 poin = potongan Rp100 saat dipakai</p>
                </Field>
              </>
            )}
          </motion.div>
        )}

        {/* Printer */}
        {activeTab === 'printer' && (
          <motion.div key="printer" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <SectionTitle>Printer Thermal (Bluetooth)</SectionTitle>
            <div className="glass-card rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.4)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-slate-800 font-bold text-sm">Status Koneksi</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    {isConnected ? `Terhubung ke: ${printerName}` : 'Belum ada printer yang terhubung'}
                  </p>
                </div>
                <div className={cn('px-3 py-1.5 rounded-full text-xs font-semibold', isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600')}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              
              <div className="flex gap-3">
                {isConnected ? (
                  <>
                    <button
                      onClick={disconnect}
                      className="flex-1 py-2.5 bg-red-50 text-red-600 font-semibold text-sm rounded-xl hover:bg-red-100 transition-colors"
                    >
                      Putuskan Koneksi
                    </button>
                    <button
                      onClick={testPrint}
                      className="flex-1 py-2.5 bg-emerald-500 text-white font-semibold text-sm rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/30"
                    >
                      Test Print
                    </button>
                  </>
                ) : (
                  <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-semibold text-sm rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    <span>{isConnecting ? 'Mencari Printer...' : 'Cari & Hubungkan Printer'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
              <p className="text-blue-700 text-sm font-medium mb-1 flex items-center gap-1.5">
                💡 Info Web Bluetooth
              </p>
              <p className="text-blue-600/80 text-xs">
                Fitur cetak langsung (auto-print) ini membutuhkan browser <b>Google Chrome</b> atau <b>Microsoft Edge</b> di Windows/Android/macOS. Pastikan Bluetooth perangkat Anda menyala dan printer sudah terhubung (paired) ke sistem operasi Anda terlebih dahulu.
              </p>
            </div>
          </motion.div>
        )}

        {/* Security (PIN lock) */}
        {activeTab === 'security' && <motion.div key="security" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}><SecurityTab /></motion.div>}
        </AnimatePresence>
      </motion.div>

      {/* Save button */}
      <AnimatePresence>
      {activeTab !== 'security' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="btn-emerald-glow w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 press disabled:opacity-50 disabled:active:scale-100"
          >
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin" /><span>Menyimpan...</span></>
            ) : (
              <><Save size={16} /><span>Simpan Pengaturan</span></>
            )}
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
