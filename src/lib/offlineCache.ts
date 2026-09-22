// Cache lokal sederhana (localStorage) untuk data yang perlu tetap tampil
// saat koneksi terputus, mis. daftar menu di halaman kasir. Bukan pengganti
// data server — hanya fallback baca-saja saat fetch dari Supabase gagal.

const PREFIX = 'nn-cache:';

export function saveCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // localStorage penuh/tidak tersedia — abaikan, ini hanya cache best-effort
  }
}

export function loadCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; savedAt: number };
    return parsed.data;
  } catch {
    return null;
  }
}

export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /failed to fetch|networkerror|network request failed|load failed|err_internet_disconnected/i.test(msg);
}
