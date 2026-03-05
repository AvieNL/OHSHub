-- Migration 007: FAQ-items voor het kennisportaal

CREATE TABLE IF NOT EXISTS public.faq_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question     TEXT NOT NULL,
  answer       TEXT NOT NULL,
  theme_slug   TEXT DEFAULT NULL,   -- NULL = algemeen (niet themagebonden)
  sort_order   INTEGER DEFAULT 0,
  published    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Iedereen mag gepubliceerde items lezen
CREATE POLICY "faq_items_read" ON public.faq_items
  FOR SELECT USING (published = true);

-- Admins mogen alles (insert, update, delete)
CREATE POLICY "faq_items_admin_write" ON public.faq_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
