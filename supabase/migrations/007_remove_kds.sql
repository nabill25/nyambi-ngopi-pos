-- ============================================================
-- Nyambi Ngopi POS — Migrasi: Hapus Fitur Dapur (KDS)
-- Jalankan file INI di Supabase SQL Editor.
-- Aman dijalankan berkali-kali.
-- ============================================================

-- Fitur Kitchen Display System (KDS) dihapus dari aplikasi.
-- Kolom kitchen_status (ditambahkan di migrasi 005_kds.sql) tidak
-- terpakai lagi. Index idx_orders_kitchen_status ikut terhapus
-- otomatis oleh Postgres saat kolomnya di-drop.
ALTER TABLE public.orders DROP COLUMN IF EXISTS kitchen_status;
