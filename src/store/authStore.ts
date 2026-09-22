import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { useShiftStore } from './shiftStore';
import { useLockStore } from './lockStore';

interface AuthStore {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  sessionError: string | null;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionError: (error: string | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updatePin: (pin: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      sessionError: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setSessionError: (sessionError) => set({ sessionError }),

      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (error) throw error;
          set({ profile: data });
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      },

      updatePin: async (pin) => {
        const profile = get().profile;
        if (!profile) throw new Error('Profil tidak ditemukan');
        const { error } = await supabase.from('profiles').update({ pin }).eq('id', profile.id);
        if (error) throw error;
        set({ profile: { ...profile, pin: pin ?? undefined } });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null });
        useShiftStore.getState().clearShift();
        useLockStore.getState().unlock();
      },

      isAdmin: () => {
        const role = get().profile?.role;
        return role === 'owner' || role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
