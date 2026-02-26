-- Rollen per gebruiker
CREATE TABLE public.user_roles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'gebruiker'
               CHECK (role IN ('admin', 'test-gebruiker', 'gebruiker')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger: automatisch rij aanmaken bij nieuwe gebruiker
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'gebruiker');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Onderzoeken (geconsolideerd voor alle 4 types)
CREATE TABLE public.investigations (
  id         UUID PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('sound','climate','physical','hazardous')),
  name       TEXT NOT NULL DEFAULT '',
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- RLS investigations
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;

-- Eigen onderzoeken: volledig CRUD
CREATE POLICY "own_investigations" ON public.investigations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin: inzien van alle onderzoeken
CREATE POLICY "admin_select_all" ON public.investigations
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- RLS user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Elke gebruiker leest eigen rol
CREATE POLICY "read_own_role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
