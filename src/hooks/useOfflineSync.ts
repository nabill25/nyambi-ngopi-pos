import { useEffect } from 'react';
import { syncOfflineQueue } from './useOrders';

// Dipasang sekali di root aplikasi: coba sinkron antrean transaksi offline
// setiap kali koneksi kembali online, dan sekali saat aplikasi baru dibuka.
export function useOfflineSync() {
  useEffect(() => {
    syncOfflineQueue();
    window.addEventListener('online', syncOfflineQueue);
    return () => window.removeEventListener('online', syncOfflineQueue);
  }, []);
}
