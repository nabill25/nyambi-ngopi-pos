import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLockStore } from '../../store/lockStore';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/utils';

const PIN_LENGTH = 4;

export function LockScreen() {
  const { profile, signOut } = useAuthStore();
  const { unlock } = useLockStore();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // A PIN can only lock the screen if one was ever set — never strand the user.
  useEffect(() => {
    if (!profile?.pin) unlock();
  }, [profile?.pin, unlock]);

  useEffect(() => {
    if (pin.length < PIN_LENGTH) return;
    if (pin === profile?.pin) {
      unlock();
      setPin('');
    } else {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 400);
    }
  }, [pin, profile?.pin, unlock]);

  const press = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    setPin((p) => p + digit);
  };

  const backspace = () => setPin((p) => p.slice(0, -1));

  const handleSignOutInstead = async () => {
    unlock();
    await signOut();
    navigate('/login');
  };

  if (!profile?.pin) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xs text-center">
        <Logo className="w-16 h-16 mx-auto mb-4" showSubtitle={false} />
        <h1 className="text-slate-800 font-bold text-lg mb-1">Layar Terkunci</h1>
        <p className="text-slate-500 text-sm mb-6">
          Masukkan PIN {profile.full_name ? `untuk ${profile.full_name}` : ''}
        </p>

        {/* PIN dots */}
        <div className={cn('flex items-center justify-center gap-3 mb-8', isShaking && 'animate-shake')}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded-full border-2 transition-all',
                i < pin.length ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300',
                isShaking && i < pin.length && 'bg-red-500 border-red-500'
              )}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="h-16 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xl font-semibold hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => press('0')}
            className="h-16 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xl font-semibold hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            0
          </button>
          <button
            onClick={backspace}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200/50 active:scale-95 transition-all"
          >
            <Delete size={20} />
          </button>
        </div>

        <button
          onClick={handleSignOutInstead}
          className="text-slate-400 hover:text-slate-600 text-xs transition-colors"
        >
          Bukan {profile.full_name ?? 'Anda'}? Keluar
        </button>
      </div>
    </div>
  );
}
