import { useState } from 'react';
import { Search, Plus, Phone, Edit2, Trash2, Users, Gem, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomers } from '../hooks/useCustomers';
import { Customer } from '../types';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const { customers, isLoading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers(search);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  const handleAdd = () => { setEditCustomer(null); setShowForm(true); };
  const handleEdit = (c: Customer, e: React.MouseEvent) => { e.stopPropagation(); setEditCustomer(c); setShowForm(true); };
  const handleDeleteClick = (c: Customer, e: React.MouseEvent) => { e.stopPropagation(); setDeleteConfirm(c); };

  const handleSave = async (data: Pick<Customer, 'full_name' | 'phone' | 'email' | 'notes'>) => {
    if (editCustomer) await updateCustomer(editCustomer.id, data);
    else await createCustomer(data);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteCustomer(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 h-full overflow-y-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau nomor HP..."
            className="glass-input w-full rounded-2xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400"
          />
        </div>
        <button
          onClick={handleAdd}
          className="btn-emerald-glow flex items-center gap-2 px-4 py-2.5 text-white rounded-2xl text-sm font-semibold transition-all active:scale-95 press"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah Pelanggan</span>
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Users size={48} className="mb-4 opacity-25" />
          <p className="text-sm font-medium">Belum ada pelanggan</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {customers.map((c, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={c.id}
            >
              <button
                onClick={() => setDetailCustomer(c)}
                className="w-full flex items-center gap-3 p-3 transition-all active:scale-[0.99] text-left glass-card hover:bg-white/40 group"
              >
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  <span className="text-emerald-700 text-sm font-bold">{c.full_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-bold truncate">{c.full_name}</p>
                  {c.phone && (
                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                      <Phone size={10} />
                      {c.phone}
                    </p>
                  )}
                </div>
                {!!c.loyalty_points && c.loyalty_points > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-full flex-shrink-0">
                    <Gem size={12} />
                    <span className="text-xs font-bold">{c.loyalty_points.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    onClick={(e) => handleEdit(c, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all active:scale-90"
                  >
                    <Edit2 size={15} />
                  </div>
                  <div
                    onClick={(e) => handleDeleteClick(c, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                  >
                    <Trash2 size={15} />
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <CustomerFormModal
        isOpen={showForm}
        customer={editCustomer}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
      />

      <CustomerDetailModal
        customer={detailCustomer}
        onClose={() => setDetailCustomer(null)}
      />

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-modal relative max-w-sm w-full rounded-3xl p-6"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <XCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-slate-800 font-bold text-lg mb-2">Hapus Pelanggan?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Pelanggan <strong className="text-slate-800">{deleteConfirm.full_name}</strong> akan dihapus permanen. Riwayat transaksinya tidak akan hilang.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="glass-btn flex-1 py-3 rounded-2xl text-slate-600 text-sm font-medium transition-all active:scale-95">
                  Batal
                </button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-all active:scale-95 press" style={{ boxShadow: '0 4px 20px rgba(239,68,68,0.35)' }}>
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
