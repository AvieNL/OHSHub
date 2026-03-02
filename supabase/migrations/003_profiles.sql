-- Profieltabel per gebruiker (naam + bedrijf)
CREATE TABLE public.profiles (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT,
  tussenvoegsel TEXT,
  last_name     TEXT,
  company       TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-aanmaken bij nieuwe gebruiker
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- RLS: eigen profiel volledig beheren
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin: alle profielen inzien
CREATE POLICY "admin_select_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );
