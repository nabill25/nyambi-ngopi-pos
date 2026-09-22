import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LockStore {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

// Persisted so a page refresh (or someone hoping to dodge the lock that way)
// doesn't bypass it — the screen stays locked until the correct PIN is entered.
export const useLockStore = create<LockStore>()(
  persist(
    (set) => ({
      isLocked: false,
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
    }),
    { name: 'lock-storage' }
  )
);
