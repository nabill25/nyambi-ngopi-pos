-- Migration 009: Tambah kolom unit ke product_recipes
-- Kolom ini menyimpan satuan yang dipakai di resep (bisa berbeda dari satuan bahan baku)
-- Contoh: bahan baku "HouseBlend" satuannya kg, tapi di resep bisa ditulis 18 g

ALTER TABLE public.product_recipes
  ADD COLUMN IF NOT EXISTS unit TEXT;

-- Isi default dengan satuan dari bahan baku untuk data yang sudah ada
UPDATE public.product_recipes pr
SET unit = (
  SELECT rm.unit
  FROM public.raw_materials rm
  WHERE rm.id = pr.raw_material_id
)
WHERE pr.unit IS NULL;
