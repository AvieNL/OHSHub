-- CMS content table for runtime-editable text
CREATE TABLE public.content (
  namespace  TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  ctype      TEXT NOT NULL DEFAULT 'plain',  -- 'plain' | 'markdown' | 'json'
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (namespace, key)
);

CREATE INDEX idx_content_namespace ON public.content(namespace);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_all" ON public.content FOR SELECT USING (true);

CREATE POLICY "write_admin" ON public.content FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
