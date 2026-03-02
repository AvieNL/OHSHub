-- Voeg privacy-akkoordvelden toe aan user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS privacy_version_accepted TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

-- Werk de trigger bij zodat metadata uit het signUp-verzoek wordt opgeslagen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, privacy_version_accepted, privacy_accepted_at)
  VALUES (
    NEW.id,
    'gebruiker',
    NEW.raw_user_meta_data->>'privacy_version_accepted',
    (NEW.raw_user_meta_data->>'privacy_accepted_at')::TIMESTAMPTZ
  );
  RETURN NEW;
END;
$$;
