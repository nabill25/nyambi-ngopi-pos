import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useOfflineQueueStore } from '../../store/offlineQueueStore';
import { syncOfflineQueue } from '../../hooks/useOrders';
import { cn } from '../../lib/utils';

export function OfflineStatusBadge() {
  const isOnline = useOnlineStatus();
  const { queue, isSyncing } = useOfflineQueueStore();

  if (isOnline && queue.length === 0) return null;

  return (
    <button
      onClick={() => syncOfflineQueue()}
      disabled={!isOnline || isSyncing || queue.length === 0}
      title={queue.length > 0 ? `${queue.length} transaksi menunggu disinkronkan` : 'Tidak ada koneksi internet'}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95',
        !isOnline
          ? 'bg-slate-200 text-slate-600'
          : 'bg-amber-500/20 text-amber-700 hover:bg-amber-500/30'
      )}
    >
      {!isOnline ? <WifiOff size={13} /> : isSyncing ? <RefreshCw size={13} className="animate-spin" /> : <CloudOff size={13} />}
      <span className="hidden sm:inline">
        {!isOnline ? 'Offline' : isSyncing ? 'Menyinkronkan...' : `${queue.length} belum sinkron`}
      </span>
    </button>
  );
}
