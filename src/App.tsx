import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { supabase, supabaseConfigError } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { useShiftStore } from './store/shiftStore';
import { useLockStore } from './store/lockStore';
import { useIdleTimer } from './hooks/useIdleTimer';
import { useOfflineSync } from './hooks/useOfflineSync';
import { Toaster } from 'sonner';
import { LockScreen } from './components/auth/LockScreen';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { POSPage } from './pages/POSPage';
import { KitchenPage } from './pages/KitchenPage';
import { MenuPage } from './pages/MenuPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomersPage } from './pages/CustomersPage';

function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-xl">
        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h1 className="text-slate-800 font-bold text-base mb-1">Konfigurasi Bermasalah</h1>
        <p className="text-slate-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

const IDLE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity auto-locks the screen

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, sessionError } = useAuthStore();
  const { isLocked, lock } = useLockStore();
  const hasPin = Boolean(profile?.pin);

  useIdleTimer(IDLE_LOCK_TIMEOUT_MS, lock, hasPin && !isLocked);
  useOfflineSync();

  if (sessionError) {
    return <ConfigErrorScreen message={sessionError} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isLocked && hasPin) return <LockScreen />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuthStore();
  if (!isAdmin()) return <Navigate to="/pos" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setUser, setSession, setLoading, setSessionError, fetchProfile } = useAuthStore();
  const { fetchSettings } = useSettingsStore();
  const { fetchCurrentShift, clearShift } = useShiftStore();

  useEffect(() => {
    if (supabaseConfigError) {
      setSessionError(supabaseConfigError);
      setLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          setSession(session);
          fetchProfile(session.user.id);
          fetchSettings();
          fetchCurrentShift(session.user.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setSessionError(err instanceof Error ? err.message : 'Gagal terhubung ke server. Periksa koneksi internet Anda.');
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setSession(session);
        fetchProfile(session.user.id);
        fetchSettings();
        fetchCurrentShift(session.user.id);
      } else {
        setUser(null);
        setSession(null);
        clearShift();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading, fetchProfile, fetchSettings, fetchCurrentShift, clearShift]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors theme="light" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="kitchen" element={<KitchenPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route
            path="menu"
            element={<AdminGuard><MenuPage /></AdminGuard>}
          />
          <Route
            path="reports"
            element={<AdminGuard><ReportsPage /></AdminGuard>}
          />
          <Route
            path="customers"
            element={<AdminGuard><CustomersPage /></AdminGuard>}
          />
          <Route
            path="settings"
            element={<AdminGuard><SettingsPage /></AdminGuard>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
