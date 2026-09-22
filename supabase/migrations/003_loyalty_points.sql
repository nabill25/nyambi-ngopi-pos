-- ============================================================
-- Nyambi Ngopi POS — Migrasi: Poin Loyalitas / Membership
-- Jalankan file INI SAJA di Supabase SQL Editor.
-- Aman dijalankan berkali-kali.
-- ============================================================

-- Saldo poin pelanggan
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS loyalty_points INT NOT NULL DEFAULT 0;

-- Snapshot poin didapat/dipakai per transaksi (untuk histori & struk)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_redeemed INT NOT NULL DEFAULT 0;
-- Nilai Rupiah dari poin yang dipakai, snapshot terpisah supaya tidak berubah
-- jika loyalty_redeem_rate diubah admin di kemudian hari
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_discount_amount INT NOT NULL DEFAULT 0;

-- Pengaturan default (nonaktif sampai diaktifkan pemilik toko di halaman Pengaturan)
INSERT INTO public.settings (key, value) VALUES
  ('loyalty_enabled', 'false'),
  ('loyalty_earn_rate', '10000'),   -- belanja Rp10.000 = 1 poin
  ('loyalty_redeem_rate', '100')    -- 1 poin = Rp100 potongan
ON CONFLICT (key) DO NOTHING;
