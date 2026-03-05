-- Migration 006: add privacy_required_version to user_roles
-- This column tracks whether an admin has pushed a required re-confirmation for this user.
-- NULL  = no re-confirmation required
-- '1.1.0' = admin required this version; cleared when user accepts

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS privacy_required_version TEXT;
