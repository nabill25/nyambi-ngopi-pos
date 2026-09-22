import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '../../types';
import { cn } from '../../lib/utils';

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  onCreate: (data: Pick<Category, 'name' | 'icon' | 'color' | 'sort_order'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ICONS = ['☕', '🥤', '🍽️', '🧃', '🍿', '🍰', '🧁', '🥪', '🍜', '🥗', '🍦', '🍵', '🧋', '🍹'];
const COLORS = ['#6F4E37', '#4A90D9', '#E67E22', '#27AE60', '#9B59B6', '#E74C3C', '#F1C40F', '#1ABC9C'];

export function CategoryList({ categories, isLoading, onCreate, onUpdate, onDelete }: CategoryListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: '☕', color: '#6F4E37', sort_order: '0' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: '', icon: '☕', color: '#6F4E37', sort_order: '0' });
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const startEdit = (cat: Category) => {
    setForm({ name: cat.name, icon: cat.icon, color: cat.color, sort_order: String(cat.sort_order) });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nama kategori wajib diisi'); return; }
    setSaving(true);
    setError(null);
    try {
      const data = { name: form.name.trim(), icon: form.icon, color: form.color, sort_order: parseInt(form.sort_order) || 0 };
      if (editingId) {
        await onUpdate(editingId, data);
      } else {
        await onCreate(data);
      }
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
        <h3 className="text-slate-800 font-semibold">Kategori Menu</h3>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-card p-4 space-y-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-slate-800 text-sm font-semibold">{editingId ? 'Edit Kategori' : 'Kategori Baru'}</h4>
            <button onClick={resetForm} className="text-slate-500 hover:text-slate-800"><X size={16} /></button>
          </div>

          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nama kategori"
            className="glass-input w-full rounded-2xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400"
            autoFocus
          />

          <div>
            <p className="text-slate-500 text-xs mb-2">Ikon</p>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={cn('w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all', form.icon === icon ? 'bg-emerald-500 ring-2 ring-emerald-400 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/50 hover:bg-white/80 border border-white/20')}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-xs mb-2">Warna</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  style={{ backgroundColor: color }}
                  className={cn('w-8 h-8 rounded-full transition-all shadow-sm', form.color === color ? 'ring-2 ring-emerald-400 ring-offset-2 scale-110' : 'hover:scale-105')}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              placeholder="Urutan"
              min={0}
              className="glass-input rounded-2xl px-3 py-2 text-sm text-slate-800"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-emerald-glow flex items-center justify-center gap-2 py-2 text-white rounded-2xl text-sm font-semibold transition-all"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Simpan</span>
            </button>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </motion.div>
      )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={cat.id}
              className="flex items-center gap-3 p-3 transition-colors glass-card hover:bg-white/40"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                style={{ backgroundColor: cat.color + '33' }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-sm font-medium">{cat.name}</p>
                <p className="text-slate-500 text-xs">Urutan: {cat.sort_order}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(cat)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all active:scale-90">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(cat.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
