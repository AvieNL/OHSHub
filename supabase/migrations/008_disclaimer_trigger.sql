-- Extend handle_new_user trigger to also capture disclaimer acceptance from sign-up metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_roles (
    user_id,
    role,
    privacy_version_accepted,
    privacy_accepted_at,
    disclaimer_version_accepted,
    disclaimer_accepted_at
  )
  VALUES (
    NEW.id,
    'gebruiker',
    NEW.raw_user_meta_data->>'privacy_version_accepted',
    (NEW.raw_user_meta_data->>'privacy_accepted_at')::TIMESTAMPTZ,
    NEW.raw_user_meta_data->>'disclaimer_version_accepted',
    (NEW.raw_user_meta_data->>'disclaimer_accepted_at')::TIMESTAMPTZ
  );
  RETURN NEW;
END;
$$;
