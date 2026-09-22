import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (data: Pick<Customer, 'full_name' | 'phone' | 'email' | 'notes'>) => Promise<void>;
}

const INPUT_CLASS = 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all';

export function CustomerFormModal({ isOpen, customer, onClose, onSave }: CustomerFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(customer?.full_name ?? '');
    setPhone(customer?.phone ?? '');
    setEmail(customer?.email ?? '');
    setNotes(customer?.notes ?? '');
    setError(null);
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Nama wajib diisi'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base flex-1">{customer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div className="space-y-1.5">
            <label className="text-slate-600 text-xs font-medium">Nama *</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT_CLASS} placeholder="Nama pelanggan" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-600 text-xs font-medium">No. HP</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT_CLASS} placeholder="08123456789" />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-600 text-xs font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLASS} placeholder="Opsional" />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-600 text-xs font-medium">Catatan</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${INPUT_CLASS} resize-none`} placeholder="Opsional" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm animate-fadeIn">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 text-sm transition-all active:scale-95">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
