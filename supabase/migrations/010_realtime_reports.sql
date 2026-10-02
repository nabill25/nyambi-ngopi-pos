-- Migration 010: Realtime untuk laporan & transaksi akun admin
-- Laporan dan halaman Transaksi berlangganan perubahan tabel orders, shifts, dan shift_cash_flows
-- supaya data semua akun kasir (penjualan, tutup kasir, kas keluar/masuk) muncul otomatis tanpa refresh.
-- Jalankan file ini di Supabase SQL Editor. Aman dijalankan berulang (tabel yang sudah terdaftar dilewati).
-- Tanpa migrasi ini aplikasi tetap jalan: data tetap termuat saat halaman dibuka atau tombol Refresh ditekan.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['orders', 'shifts', 'shift_cash_flows'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
