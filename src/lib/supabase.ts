import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// A missing/misconfigured env var used to `throw` here at module-import
// time. That happens before React ever mounts, so no ErrorBoundary could
// catch it — the page just stayed blank white with only a console error.
// Instead we record the problem and let AuthGuard show a real error screen.
export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey
  ? 'Konfigurasi Supabase tidak ditemukan. Salin .env.example ke .env dan isi URL + anon key Supabase Anda.'
  : null;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
