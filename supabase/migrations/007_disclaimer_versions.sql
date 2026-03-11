-- Disclaimer version history table
-- Each row represents a published version of the disclaimer.
-- The current (latest) version is always disclaimer_versions ordered by created_at DESC LIMIT 1.
CREATE TABLE public.disclaimer_versions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number TEXT NOT NULL UNIQUE,           -- e.g. '1.0.0', '1.1.0', '2.0.0'
  version_type   TEXT NOT NULL CHECK (version_type IN ('major', 'minor', 'patch')),
  body           TEXT NOT NULL,                  -- full markdown body of this version
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_disclaimer_versions_created ON public.disclaimer_versions(created_at DESC);

ALTER TABLE public.disclaimer_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed to display version history on /disclaimer)
CREATE POLICY "read_all" ON public.disclaimer_versions FOR SELECT USING (true);

-- Only admins can insert new versions
CREATE POLICY "insert_admin" ON public.disclaimer_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Add disclaimer acceptance fields to user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS disclaimer_version_accepted  TEXT,
  ADD COLUMN IF NOT EXISTS disclaimer_accepted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disclaimer_required_version  TEXT;
