-- ============================================================
-- Nyambi Ngopi POS — Migrasi Tahap 4: Petty Cash & Core POS
-- Jalankan file INI di Supabase SQL Editor.
-- ============================================================

-- Tabel Arus Kas (Petty Cash) per Shift
CREATE TABLE IF NOT EXISTS public.shift_cash_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  amount INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_cash_flows_shift_id ON public.shift_cash_flows(shift_id);

-- RLS
ALTER TABLE public.shift_cash_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_flows_select" ON public.shift_cash_flows;
CREATE POLICY "cash_flows_select" ON public.shift_cash_flows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cash_flows_insert" ON public.shift_cash_flows;
CREATE POLICY "cash_flows_insert" ON public.shift_cash_flows FOR INSERT TO authenticated WITH CHECK (true);

