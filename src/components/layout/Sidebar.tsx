import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Lock,
  ChevronRight,
  MonitorPlay,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useLockStore } from '../../store/lockStore';
import { Logo } from '../ui/Logo';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/pos', icon: ShoppingCart, label: 'Kasir' },
  { to: '/kitchen', icon: MonitorPlay, label: 'Dapur (KDS)' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu', adminOnly: true },
  { to: '/orders', icon: ClipboardList, label: 'Transaksi' },
  { to: '/customers', icon: Users, label: 'Pelanggan', adminOnly: true },
  { to: '/reports', icon: BarChart3, label: 'Laporan', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Pengaturan', adminOnly: true },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuthStore();
  const { lock } = useLockStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || profile?.role === 'owner' || profile?.role === 'admin'
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden animate-overlayIn"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar — Frosted Dark Glass */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-64 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'glass-dark'
        )}
        style={{
          background: 'linear-gradient(160deg, rgba(13,61,32,0.80) 0%, rgba(7,38,19,0.90) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRight: '1px solid rgba(69,185,117,0.15)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div
            className="w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105"
            style={{
              background: 'rgba(31,156,86,0.25)',
              border: '1px solid rgba(69,185,117,0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Logo className="w-7 h-7" showSubtitle={false} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight">Nyambi Ngopi</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Point of Sale</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'text-white'
                    : 'hover:translate-x-0.5'
                )
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg, rgba(31,156,86,0.55), rgba(69,185,117,0.35))',
                border: '1px solid rgba(69,185,117,0.3)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(31,156,86,0.25)',
                color: 'white',
              } : {
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
                        borderRadius: 'inherit',
                      }}
                    />
                  )}
                  <item.icon
                    size={18}
                    className="transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
                    style={isActive ? { color: '#45b975' } : {}}
                  />
                  <span className="flex-1" style={!isActive ? { color: 'rgba(255,255,255,0.6)' } : {}}>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="animate-fadeIn opacity-70" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div
            className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(31,156,86,0.4), rgba(69,185,117,0.25))',
                border: '1px solid rgba(69,185,117,0.3)',
              }}
            >
              <span className="text-xs font-bold" style={{ color: '#45b975' }}>
                {profile?.full_name?.charAt(0).toUpperCase() ?? 'K'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{profile?.full_name ?? 'Kasir'}</p>
              <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.role ?? 'cashier'}</p>
            </div>
          </div>
          {profile?.pin && (
            <button
              onClick={() => { lock(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 press mb-1"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Lock size={16} />
              <span>Kunci Layar</span>
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200 press"
            style={{ color: 'rgba(255,100,100,0.75)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
