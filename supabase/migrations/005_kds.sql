-- ============================================================
-- Nyambi Ngopi POS — Migrasi Tahap 3: Kitchen Display System (KDS)
-- Jalankan file INI di Supabase SQL Editor.
-- ============================================================

-- Menambahkan status khusus dapur pada pesanan
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS kitchen_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (kitchen_status IN ('pending', 'preparing', 'ready', 'delivered'));

-- Indexing untuk mempercepat pengambilan data layar dapur (yang pending/preparing)
CREATE INDEX IF NOT EXISTS idx_orders_kitchen_status ON public.orders(kitchen_status);
