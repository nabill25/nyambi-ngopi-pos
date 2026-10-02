import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const DEBOUNCE_MS = 300;

// Panggil onChange setiap ada perubahan (insert/update/delete) di salah satu tabel — Supabase Realtime.
// Rentetan perubahan beruntun digabung jadi satu panggilan, dan callback terbaru selalu yang dipakai
// tanpa berlangganan ulang. Channel dibersihkan saat komponen dilepas.
export function useTableChanges(tables: string[], onChange: () => void) {
  const callbackRef = useRef(onChange);
  const tablesKey = tables.join(',');

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(), DEBOUNCE_MS);
    };

    // Nama unik per langganan supaya tidak bentrok saat komponen dipasang ulang (double-subscribe)
    const channel = supabase.channel(`changes_${tablesKey}_${Date.now()}`);
    tablesKey.split(',').forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, schedule);
    });
    channel.subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [tablesKey]);
}
