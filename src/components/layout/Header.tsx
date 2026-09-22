import { Menu, Bell, Clock, PackageX, PackageMinus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useSettingsStore } from '../../store/settingsStore';
import { useLowStockAlert } from '../../hooks/useLowStockAlert';
import { OfflineStatusBadge } from './OfflineStatusBadge';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [showAlerts, setShowAlerts] = useState(false);
  const { settings } = useSettingsStore();
  const { lowStock, outOfStock, totalAlerts } = useLowStockAlert();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showAlerts) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAlerts]);

  return (
    <header
      className="h-16 flex items-center gap-4 px-4 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.35)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.5), 0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl transition-all press"
        style={{
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: '#0d3d20',
        }}
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <h1 className="font-bold text-slate-800 text-base flex-1">{title}</h1>

      {/* Clock */}
      <div className="hidden sm:flex items-center gap-2 text-slate-500 text-sm">
        <Clock size={14} className="text-emerald-600" />
        <span className="font-mono text-slate-700">{format(time, 'HH:mm:ss')}</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">{format(time, 'EEE, dd MMM', { locale: localeId })}</span>
      </div>

      <OfflineStatusBadge />

      {/* Store name badge — glass pill */}
      <div className="hidden md:flex items-center gap-2">
        <div
          className="glass-pill px-3 py-1.5"
          style={{ color: '#0d3d20', fontSize: '0.75rem', fontWeight: 600 }}
        >
          {settings.store_name}
        </div>
      </div>

      {/* Stock alerts bell */}
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setShowAlerts((v) => !v)}
          className="relative p-2 rounded-xl transition-all press"
          style={{
            background: showAlerts ? 'rgba(31,156,86,0.12)' : 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: '#334155',
          }}
        >
          <Bell size={18} />
          {totalAlerts > 0 && (
            <span
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-scaleIn"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}
            >
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showAlerts && (
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl overflow-hidden z-50 origin-top-right"
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <h3 className="text-slate-800 font-semibold text-sm">Notifikasi Stok</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {totalAlerts === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Semua stok aman ✓</p>
                ) : (
                  <div className="p-2 space-y-1">
                    {outOfStock.map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-red-50/50 transition-colors">
                        <PackageX size={15} className="text-red-500 flex-shrink-0" />
                        <span className="text-slate-700 text-sm flex-1 truncate">{p.name}</span>
                        <span className="text-red-500 text-xs font-semibold flex-shrink-0">Habis</span>
                      </div>
                    ))}
                    {lowStock.map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-amber-50/50 transition-colors">
                        <PackageMinus size={15} className="text-amber-500 flex-shrink-0" />
                        <span className="text-slate-700 text-sm flex-1 truncate">{p.name}</span>
                        <span className="text-amber-500 text-xs font-semibold flex-shrink-0">Sisa {p.stock_quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {totalAlerts > 0 && (
                <Link
                  to="/menu"
                  onClick={() => setShowAlerts(false)}
                  className={cn(
                    'block text-center py-2.5 text-xs font-medium transition-colors',
                    'text-emerald-700 hover:bg-emerald-500/5'
                  )}
                  style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                >
                  Kelola Stok →
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
