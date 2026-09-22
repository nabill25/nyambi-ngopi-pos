import { useState } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer } from '../../types';

interface CustomerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerPickerModal({ isOpen, onClose, onSelect }: CustomerPickerModalProps) {
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { customers, isLoading, createCustomer } = useCustomers(search);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    onClose();
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) { setError('Nama wajib diisi'); return; }
    setIsSaving(true);
    setError(null);
    try {
      const customer = await createCustomer({ full_name: newName.trim(), phone: newPhone.trim() || null, email: null, notes: null });
      handleSelect(customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah pelanggan');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-overlayIn" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp sm:animate-scaleIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base flex-1">Pilih Pelanggan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor HP..."
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Memuat...</div>
            ) : customers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Pelanggan tidak ditemukan</div>
            ) : (
              customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.99] text-left"
                >
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 text-xs font-bold">{c.full_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium truncate">{c.full_name}</p>
                    {c.phone && <p className="text-slate-500 text-xs">{c.phone}</p>}
                  </div>
                </button>
              ))
            )}
          </div>

          {!showNewForm ? (
            <button
              onClick={() => { setShowNewForm(true); setNewName(search); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-400 transition-all text-sm"
            >
              <UserPlus size={15} />
              <span>Tambah Pelanggan Baru</span>
            </button>
          ) : (
            <div className="bg-white rounded-xl p-3 space-y-2 border border-slate-100 animate-fadeIn">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama pelanggan"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="No. HP (opsional)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateNew}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-lg text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check size={13} />
                  <span>Simpan & Pilih</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
