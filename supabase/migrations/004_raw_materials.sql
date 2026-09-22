-- ============================================================
-- Nyambi Ngopi POS — Migrasi Tahap 2: Resep & Bahan Baku
-- Jalankan file INI di Supabase SQL Editor.
-- ============================================================

-- 1. Tabel Bahan Baku
CREATE TABLE IF NOT EXISTS public.raw_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- e.g., 'g', 'ml', 'pcs'
  stock NUMERIC NOT NULL DEFAULT 0,
  cost_per_unit INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabel Resep Produk (Relasi Produk <-> Bahan Baku)
CREATE TABLE IF NOT EXISTS public.product_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing untuk mempercepat join resep
CREATE INDEX IF NOT EXISTS idx_product_recipes_product_id ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_raw_material_id ON public.product_recipes(raw_material_id);

-- RLS (Row Level Security) untuk Bahan Baku
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "raw_materials_select" ON public.raw_materials;
CREATE POLICY "raw_materials_select" ON public.raw_materials FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "raw_materials_all" ON public.raw_materials;
CREATE POLICY "raw_materials_all" ON public.raw_materials FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- RLS untuk Resep
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_recipes_select" ON public.product_recipes;
CREATE POLICY "product_recipes_select" ON public.product_recipes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "product_recipes_all" ON public.product_recipes;
CREATE POLICY "product_recipes_all" ON public.product_recipes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- 3. Trigger Pengurangan Stok Bahan Baku saat Transaksi Berhasil
CREATE OR REPLACE FUNCTION deduct_raw_materials_on_order()
RETURNS TRIGGER AS $$
DECLARE
  recipe_record RECORD;
BEGIN
  -- Ambil semua resep yang terhubung ke produk dari order_item baru
  FOR recipe_record IN 
    SELECT raw_material_id, quantity_required 
    FROM public.product_recipes 
    WHERE product_id = NEW.product_id
  LOOP
    -- Kurangi stok bahan baku (quantity barang di order_items dikali quantity resep)
    UPDATE public.raw_materials 
    SET stock = stock - (recipe_record.quantity_required * NEW.quantity)
    WHERE id = recipe_record.raw_material_id;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_raw_materials ON public.order_items;
CREATE TRIGGER trg_deduct_raw_materials
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION deduct_raw_materials_on_order();

-- 4. Trigger Pengembalian Stok saat Transaksi Dibatalkan (Void)
CREATE OR REPLACE FUNCTION restore_raw_materials_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  recipe_record RECORD;
BEGIN
  -- Jika status pesanan berubah dari 'completed' ke 'cancelled'
  IF OLD.status = 'completed' AND NEW.status = 'cancelled' THEN
    -- Loop semua item di order tersebut
    FOR item_record IN 
      SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id
    LOOP
      -- Loop semua resep untuk item tersebut
      FOR recipe_record IN 
        SELECT raw_material_id, quantity_required FROM public.product_recipes WHERE product_id = item_record.product_id
      LOOP
        -- Kembalikan stok bahan baku
        UPDATE public.raw_materials 
        SET stock = stock + (recipe_record.quantity_required * item_record.quantity)
        WHERE id = recipe_record.raw_material_id;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restore_raw_materials ON public.orders;
CREATE TRIGGER trg_restore_raw_materials
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION restore_raw_materials_on_cancel();
