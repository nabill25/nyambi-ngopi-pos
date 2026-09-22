-- ============================================================
-- Nyambi Ngopi POS — Migrasi: Promo / Voucher
-- Jalankan file INI SAJA di Supabase SQL Editor.
-- Aman dijalankan berkali-kali.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,              -- kosong = otomatis berlaku (tanpa kode); diisi = kasir input kode
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'amount')),
  discount_value INT NOT NULL DEFAULT 0,
  min_purchase INT NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_name TEXT;

CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Semua kasir perlu bisa lihat promo (untuk auto-apply & validasi kode);
-- hanya admin/owner yang bisa membuat/mengubah/menghapus.
DROP POLICY IF EXISTS "promotions_select" ON public.promotions;
CREATE POLICY "promotions_select" ON public.promotions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "promotions_write" ON public.promotions;
CREATE POLICY "promotions_write" ON public.promotions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
