-- ============================================================
-- Nyambi Ngopi POS — Supabase Schema
-- Jalankan file ini di Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'admin', 'cashier')),
  pin TEXT, -- 4-digit PIN for quick login
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '☕',
  color TEXT DEFAULT '#8B4513',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL DEFAULT 0, -- stored in IDR (no decimals)
  cost_price INT DEFAULT 0,     -- HPP
  image_url TEXT,
  sku TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  track_stock BOOLEAN NOT NULL DEFAULT false,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5, -- alert cashier/owner when stock drops to this level
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5;

-- ============================================================
-- PRODUCT MODIFIERS (variants / add-ons, e.g. Ukuran, Level Gula)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,             -- e.g. "Ukuran", "Level Gula", "Tambahan"
  selection_type TEXT NOT NULL DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_modifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.product_modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,             -- e.g. "Large", "Less Sugar", "Extra Shot"
  price_delta INT NOT NULL DEFAULT 0, -- added to base price when selected (can be 0)
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modifier_groups_product ON public.product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_modifiers_group ON public.product_modifiers(group_id);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(full_name);

-- Saldo poin loyalitas / membership
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS loyalty_points INT NOT NULL DEFAULT 0;

-- ============================================================
-- ORDERS (Transaction header)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE, -- e.g. NN-20240101-001
  cashier_id UUID REFERENCES public.profiles(id),
  cashier_name TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'qris', 'transfer')),
  subtotal INT NOT NULL DEFAULT 0,
  discount_amount INT NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount INT NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_amount INT NOT NULL DEFAULT 0,
  paid_amount INT NOT NULL DEFAULT 0,       -- amount customer paid
  change_amount INT NOT NULL DEFAULT 0,     -- kembalian
  notes TEXT,
  cancel_reason TEXT,                       -- alasan saat order di-void
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,                       -- snapshot nama pelanggan saat transaksi, untuk struk & riwayat
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- snapshot at time of order
  product_price INT NOT NULL,
  product_cost INT NOT NULL DEFAULT 0, -- snapshot of HPP at time of order, for profit reports
  quantity INT NOT NULL DEFAULT 1,
  discount_amount INT NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal INT NOT NULL DEFAULT 0,
  notes TEXT,
  modifiers_snapshot JSONB, -- selected variant/add-on options at time of order, e.g. [{"name":"Large","price_delta":5000}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS modifiers_snapshot JSONB;

-- Migration guard: add the new columns if this schema already existed before them
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_cost INT NOT NULL DEFAULT 0;

-- ============================================================
-- PROMOTIONS (promo / voucher)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,              -- null = auto-apply; set = cashier must enter this code
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

-- ============================================================
-- LOYALTY POINTS (poin belanja / membership)
-- ============================================================
-- Snapshot poin didapat/dipakai per transaksi, untuk histori & struk
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_redeemed INT NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_discount_amount INT NOT NULL DEFAULT 0;

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SHIFTS (buka/tutup kasir & rekonsiliasi kas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id UUID REFERENCES public.profiles(id),
  cashier_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opening_cash INT NOT NULL DEFAULT 0,   -- kas awal saat buka kasir
  closing_cash INT,                      -- kas fisik yang dihitung saat tutup kasir
  expected_cash INT,                     -- kas yang seharusnya ada (dihitung sistem)
  cash_difference INT,                   -- closing_cash - expected_cash (selisih)
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Link setiap order ke shift saat dibuat, supaya rekap kas per-shift akurat
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_shift ON public.orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON public.shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'cashier');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can see all profiles, update their own
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Categories: all authenticated users can read, only admin/owner can write
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_delete" ON public.categories FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Products: same as categories
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Product modifiers: same access pattern as products
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

-- Customers: any cashier can look up / register / update; only admin/owner can delete
DROP POLICY IF EXISTS "customers_select" ON public.customers;
CREATE POLICY "customers_select" ON public.customers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "customers_insert" ON public.customers;
CREATE POLICY "customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "customers_update" ON public.customers;
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "customers_delete" ON public.customers;
CREATE POLICY "customers_delete" ON public.customers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Promotions: all authenticated can read, only admin/owner can write
DROP POLICY IF EXISTS "promotions_select" ON public.promotions;
CREATE POLICY "promotions_select" ON public.promotions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "promotions_write" ON public.promotions;
CREATE POLICY "promotions_write" ON public.promotions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Orders: all authenticated can insert & select, only admin/owner can cancel
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Order items: linked to orders
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- Settings: all authenticated can read, only admin/owner can write
DROP POLICY IF EXISTS "settings_select" ON public.settings;
CREATE POLICY "settings_select" ON public.settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "settings_upsert" ON public.settings;
CREATE POLICY "settings_upsert" ON public.settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Shifts: everyone can see shift history (for reports); a cashier can only open
-- their own shift; only the shift's own cashier or an admin/owner can close it
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "shifts_insert" ON public.shifts;
CREATE POLICY "shifts_insert" ON public.shifts FOR INSERT TO authenticated
  WITH CHECK (cashier_id = auth.uid());
DROP POLICY IF EXISTS "shifts_update" ON public.shifts;
CREATE POLICY "shifts_update" ON public.shifts FOR UPDATE TO authenticated
  USING (
    cashier_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================
-- STORAGE (product photos uploaded from device)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (product photos are shown on the public-facing POS/menu screens)
DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
CREATE POLICY "product_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only admin/owner can upload, replace, or delete product photos
DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
CREATE POLICY "product_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );
DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
CREATE POLICY "product_images_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;
CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default categories
INSERT INTO public.categories (name, icon, color, sort_order) VALUES
  ('Kopi', '☕', '#6F4E37', 1),
  ('Non-Kopi', '🥤', '#4A90D9', 2),
  ('Makanan', '🍽️', '#E67E22', 3),
  ('Minuman Lainnya', '🧃', '#27AE60', 4),
  ('Snack', '🍿', '#9B59B6', 5)
ON CONFLICT DO NOTHING;

-- Default settings
INSERT INTO public.settings (key, value) VALUES
  ('store_name', 'Nyambi Ngopi'),
  ('store_address', 'Depok, Jawa Barat'),
  ('store_phone', ''),
  ('store_instagram', '@nyambi.ngopi'),
  ('receipt_footer', 'Terima kasih sudah mampir! ☕'),
  ('tax_enabled', 'false'),
  ('tax_percent', '0'),
  ('tax_label', 'PB1'),
  ('currency', 'IDR'),
  ('receipt_paper_size', '80mm'),
  ('printer_name', ''),
  ('loyalty_enabled', 'false'),
  ('loyalty_earn_rate', '10000'),
  ('loyalty_redeem_rate', '100')
ON CONFLICT (key) DO NOTHING;

-- Sample products
WITH cat AS (SELECT id, name FROM public.categories)
INSERT INTO public.products (category_id, name, price, description, is_active, sort_order)
SELECT
  cat.id,
  products.name,
  products.price,
  products.description,
  true,
  products.sort_order
FROM (VALUES
  ('Kopi', 'Americano', 18000, 'Espresso + air panas', 1),
  ('Kopi', 'Cappuccino', 22000, 'Espresso + susu + foam', 2),
  ('Kopi', 'Latte', 24000, 'Espresso + susu steamed', 3),
  ('Kopi', 'V60 Single Origin', 28000, 'Manual brew V60', 4),
  ('Kopi', 'Cold Brew', 25000, 'Kopi seduh dingin 12 jam', 5),
  ('Non-Kopi', 'Matcha Latte', 26000, 'Matcha premium + susu', 1),
  ('Non-Kopi', 'Chocolate', 22000, 'Coklat belgik premium', 2),
  ('Non-Kopi', 'Teh Tarik', 18000, 'Teh susu ala Malaysia', 3),
  ('Makanan', 'Croissant', 22000, 'Croissant butter original', 1),
  ('Makanan', 'Sandwich Telur', 28000, 'Sandwich roti gandum + telur', 2),
  ('Makanan', 'Banana Bread', 25000, 'Banana bread homemade', 3),
  ('Snack', 'Kentang Goreng', 20000, 'Kentang goreng crispy', 1),
  ('Snack', 'Donat', 15000, 'Donat gula glazed', 2)
) AS products(category_name, name, price, description, sort_order)
JOIN cat ON cat.name = products.category_name
ON CONFLICT DO NOTHING;
