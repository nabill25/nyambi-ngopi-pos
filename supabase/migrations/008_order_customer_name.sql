-- ============================================================
-- Nyambi Ngopi POS — Migrasi: Nama Pelanggan di Struk/Transaksi
-- Jalankan file INI di Supabase SQL Editor.
-- Aman dijalankan berkali-kali.
-- ============================================================

-- Sebelumnya orders hanya menyimpan customer_id (relasi), sehingga
-- nama pelanggan tidak pernah muncul di struk maupun riwayat transaksi
-- kecuali di-join manual. Sekarang nama pelanggan di-snapshot langsung
-- ke kolom ini saat transaksi dibuat (sama seperti cashier_name),
-- supaya struk & riwayat tetap benar walau nama pelanggan diubah belakangan.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Isi otomatis untuk transaksi lama yang sudah punya customer_id tapi
-- belum punya snapshot nama (dari sebelum kolom ini ada).
UPDATE public.orders o
SET customer_name = c.full_name
FROM public.customers c
WHERE o.customer_id = c.id AND o.customer_name IS NULL;
