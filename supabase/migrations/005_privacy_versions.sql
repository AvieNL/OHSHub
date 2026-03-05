-- Privacy version history table
-- Each row represents a published version of the privacy policy.
-- The current (latest) version is always privacy_versions ordered by created_at DESC LIMIT 1.
CREATE TABLE public.privacy_versions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number TEXT NOT NULL UNIQUE,           -- e.g. '1.0.0', '1.1.0', '2.0.0'
  version_type   TEXT NOT NULL CHECK (version_type IN ('major', 'minor', 'patch')),
  body           TEXT NOT NULL,                  -- full markdown body of this version
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_privacy_versions_created ON public.privacy_versions(created_at DESC);

ALTER TABLE public.privacy_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed to display version history on /privacy)
CREATE POLICY "read_all" ON public.privacy_versions FOR SELECT USING (true);

-- Only admins can insert new versions
CREATE POLICY "insert_admin" ON public.privacy_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
