-- ============================================================
-- Nyambi Ngopi POS — Migrasi Tertunda
-- Jalankan file INI SAJA di Supabase SQL Editor.
--
-- Berisi semua penambahan sejak fitur "Shift & Kas" (yang sudah
-- Anda jalankan berhasil sebelumnya). Aman dijalankan berkali-kali
-- — setiap perintah memakai IF NOT EXISTS / DROP IF EXISTS, jadi
-- tidak akan error walau sebagian sudah pernah diterapkan.
-- ============================================================

-- ── 1. Alasan Void Transaksi ───────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- ── 2. Laporan Profit Margin (snapshot HPP per item transaksi) ─
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_cost INT NOT NULL DEFAULT 0;

-- ── 3. Alert Stok Menipis ──────────────────────────────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5;

-- ── 4. Product Variants & Modifier (Ukuran, Level Gula, dll) ───
CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  selection_type TEXT NOT NULL DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.product_modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS modifiers_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_modifier_groups_product ON public.product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_group ON public.product_modifiers(group_id);

ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modifier_groups_select" ON public.product_modifier_groups;
CREATE POLICY "modifier_groups_select" ON public.product_modifier_groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modifier_groups_write" ON public.product_modifier_groups;
CREATE POLICY "modifier_groups_write" ON public.product_modifier_groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "modifiers_select" ON public.product_modifiers;
CREATE POLICY "modifiers_select" ON public.product_modifiers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modifiers_write" ON public.product_modifiers;
CREATE POLICY "modifiers_write" ON public.product_modifiers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ── 5. Database Pelanggan ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(full_name);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_select" ON public.customers;
CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "customers_insert" ON public.customers;
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "customers_update" ON public.customers;
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "customers_delete" ON public.customers;
CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- ============================================================
-- Selesai. Semua tabel/kolom baru sampai dengan fitur
-- "Database Pelanggan" sudah tercakup di file ini.
-- ============================================================
