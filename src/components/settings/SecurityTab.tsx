import { useState } from 'react';
import { Save, Loader2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { SectionTitle, Field, SETTINGS_INPUT_CLASS } from './SettingsField';

export function SecurityTab() {
  const { profile, updatePin } = useAuthStore();
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pinInput)) { setError('PIN harus 4 digit angka'); return; }
    if (pinInput !== pinConfirm) { setError('Konfirmasi PIN tidak cocok'); return; }
    setError(null);
    setIsSaving(true);
    try {
      await updatePin(pinInput);
      setPinInput('');
      setPinConfirm('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan PIN');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePin = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updatePin(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus PIN');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SectionTitle>PIN Kunci Layar</SectionTitle>
      <p className="text-slate-500 text-xs -mt-2">
        PIN dipakai untuk mengunci layar kasir sementara tanpa perlu logout. Layar juga otomatis terkunci setelah 5 menit tidak ada aktivitas.
      </p>

      <div className={cn(
        'flex items-center justify-between p-3 rounded-xl text-xs font-medium',
        profile?.pin ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-100 text-slate-500'
      )}>
        <span>Status</span>
        <span>{profile?.pin ? 'PIN aktif' : 'PIN belum diatur'}</span>
      </div>

      <Field label="PIN Baru (4 digit)">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className={SETTINGS_INPUT_CLASS}
        />
      </Field>
      <Field label="Konfirmasi PIN">
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pinConfirm}
          onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className={SETTINGS_INPUT_CLASS}
        />
      </Field>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-sm animate-fadeIn">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSavePin}
          disabled={isSaving}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95',
            saved ? 'bg-green-500' : 'bg-emerald-500 hover:bg-emerald-400',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : saved ? '✓ Tersimpan!' : <><Save size={15} /><span>Simpan PIN</span></>}
        </button>
        {profile?.pin && (
          <button
            onClick={handleRemovePin}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-300 text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 size={15} />
            <span>Hapus PIN</span>
          </button>
        )}
      </div>
    </>
  );
}
