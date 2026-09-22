import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, Loader2, Ticket } from 'lucide-react';
import { usePromotions } from '../../hooks/usePromotions';
import { Promotion, PromoDiscountType } from '../../types';
import { formatCurrency, cn } from '../../lib/utils';

const EMPTY_FORM = {
  name: '',
  code: '',
  discount_type: 'percent' as PromoDiscountType,
  discount_value: '',
  min_purchase: '0',
  start_date: '',
  end_date: '',
  is_active: true,
};

export function PromotionsTab() {
  const { promotions, isLoading, createPromotion, updatePromotion, deletePromotion } = usePromotions();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const startEdit = (promo: Promotion) => {
    setForm({
      name: promo.name,
      code: promo.code ?? '',
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      min_purchase: String(promo.min_purchase),
      start_date: promo.start_date ?? '',
      end_date: promo.end_date ?? '',
      is_active: promo.is_active,
    });
    setEditingId(promo.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama promo wajib diisi'); return; }
    const value = parseInt(form.discount_value, 10);
    if (isNaN(value) || value <= 0) { setError('Nilai diskon tidak valid'); return; }
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: form.name.trim(),
        code: form.code.trim() ? form.code.trim().toUpperCase() : null,
        discount_type: form.discount_type,
        discount_value: value,
        min_purchase: parseInt(form.min_purchase, 10) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
        sort_order: promotions.length,
      };
      if (editingId) await updatePromotion(editingId, data);
      else await createPromotion(data);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-slate-800 font-semibold">Promo & Voucher</h3>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition-all active:scale-95"
        >
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-slate-800 text-sm font-semibold">{editingId ? 'Edit Promo' : 'Promo Baru'}</h4>
            <button onClick={resetForm} className="text-slate-500 hover:text-slate-800"><X size={16} /></button>
          </div>

          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nama promo (mis. Diskon Member)"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            autoFocus
          />

          <div className="space-y-1">
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="Kode voucher (kosongkan = otomatis berlaku)"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <p className="text-slate-400 text-xs">Kosong = promo otomatis muncul di kasir tanpa kode</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1">
              {(['percent', 'amount'] as PromoDiscountType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setForm((f) => ({ ...f, discount_type: type }))}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                    form.discount_type === type ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500'
                  )}
                >
                  {type === 'percent' ? '%' : 'Rp'}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={form.discount_value}
              onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
              placeholder={form.discount_type === 'percent' ? 'Mis. 10' : 'Mis. 5000'}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-500 text-xs">Minimal Belanja (Rp)</label>
            <input
              type="number"
              value={form.min_purchase}
              onChange={(e) => setForm((f) => ({ ...f, min_purchase: e.target.value }))}
              min={0}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-slate-500 text-xs">Mulai (opsional)</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-500 text-xs">Berakhir (opsional)</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer"
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
          >
            <p className="text-slate-800 text-sm font-medium">Aktif</p>
            <div className={cn('w-10 h-5 rounded-full relative transition-colors', form.is_active ? 'bg-emerald-500' : 'bg-slate-200')}>
              <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_active ? 'translate-x-5' : 'translate-x-0.5')} />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all active:scale-95"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Simpan</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Ticket size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Belum ada promo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => (
            <div key={promo.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl animate-fadeIn">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', promo.is_active ? 'bg-emerald-500/10' : 'bg-slate-100')}>
                <Ticket size={16} className={promo.is_active ? 'text-emerald-600' : 'text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-slate-800 text-sm font-medium truncate">{promo.name}</p>
                  {!promo.is_active && <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full flex-shrink-0">Nonaktif</span>}
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {promo.discount_type === 'percent' ? `${promo.discount_value}%` : formatCurrency(promo.discount_value)}
                  {promo.code ? ` · Kode: ${promo.code}` : ' · Otomatis'}
                  {promo.min_purchase > 0 ? ` · Min. ${formatCurrency(promo.min_purchase)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(promo)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all active:scale-90">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deletePromotion(promo.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
