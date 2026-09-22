import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Package } from 'lucide-react';
import { useRawMaterials } from '../../hooks/useRawMaterials';
import { RawMaterial } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export function RawMaterialsTab() {
  const { materials, isLoading, error, addMaterial, updateMaterial, deleteMaterial } = useRawMaterials();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', unit: '', stock: '', cost: '' });

  const resetForm = () => {
    setFormData({ name: '', unit: '', stock: '', cost: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.unit) {
      toast.error('Nama dan Satuan wajib diisi');
      return;
    }

    const payload = {
      name: formData.name,
      unit: formData.unit,
      stock: parseFloat(formData.stock) || 0,
      cost_per_unit: parseInt(formData.cost, 10) || 0,
      is_active: true
    };

    if (editingId) {
      await updateMaterial(editingId, payload);
    } else {
      await addMaterial(payload);
    }
    resetForm();
  };

  const startEdit = (mat: RawMaterial) => {
    setFormData({
      name: mat.name,
      unit: mat.unit,
      stock: mat.stock.toString(),
      cost: mat.cost_per_unit.toString()
    });
    setEditingId(mat.id);
    setIsAdding(false);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  if (isLoading && materials.length === 0) {
    return <div className="p-8 text-center text-slate-500">Memuat bahan baku...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Bahan Baku</h2>
          <p className="text-sm text-slate-500">Kelola stok inventaris gudang dan harga pokok bahan mentah.</p>
        </div>
        <button
          onClick={startAdd}
          disabled={isAdding}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Tambah Bahan</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Bahan</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4 text-right">Stok Saat Ini</th>
                <th className="px-6 py-4 text-right">Harga Satuan / HPP</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isAdding && (
                <tr className="bg-emerald-50/50">
                  <td className="px-6 py-3">
                    <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Biji Kopi Arabica" className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-sm" autoFocus />
                  </td>
                  <td className="px-6 py-3">
                    <input type="text" value={formData.unit} onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))} placeholder="gram / ml / pcs" className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-sm" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="number" value={formData.stock} onChange={(e) => setFormData(p => ({ ...p, stock: e.target.value }))} placeholder="0" className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-sm text-right" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="number" value={formData.cost} onChange={(e) => setFormData(p => ({ ...p, cost: e.target.value }))} placeholder="0" className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-sm text-right" />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={handleSave} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"><Check size={16} /></button>
                      <button onClick={resetForm} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              )}

              {materials.length === 0 && !isAdding ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Package size={32} className="mx-auto mb-3 opacity-20" />
                    Belum ada bahan baku terdaftar
                  </td>
                </tr>
              ) : (
                materials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                    {editingId === mat.id ? (
                      <>
                        <td className="px-6 py-3"><input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-1.5 border border-emerald-500 rounded-lg text-sm" /></td>
                        <td className="px-6 py-3"><input type="text" value={formData.unit} onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))} className="w-full px-3 py-1.5 border border-emerald-500 rounded-lg text-sm" /></td>
                        <td className="px-6 py-3"><input type="number" value={formData.stock} onChange={(e) => setFormData(p => ({ ...p, stock: e.target.value }))} className="w-full px-3 py-1.5 border border-emerald-500 rounded-lg text-sm text-right" /></td>
                        <td className="px-6 py-3"><input type="number" value={formData.cost} onChange={(e) => setFormData(p => ({ ...p, cost: e.target.value }))} className="w-full px-3 py-1.5 border border-emerald-500 rounded-lg text-sm text-right" /></td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={handleSave} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"><Check size={16} /></button>
                            <button onClick={resetForm} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"><X size={16} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-slate-800">{mat.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium">{mat.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={mat.stock <= 5 ? 'text-red-500 font-bold' : 'text-slate-700'}>
                            {mat.stock} {mat.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                          {formatCurrency(mat.cost_per_unit)} / {mat.unit}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEdit(mat)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => { if(confirm('Hapus bahan baku ini? Resep yang memakai bahan ini akan terhapus juga.')) deleteMaterial(mat.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
