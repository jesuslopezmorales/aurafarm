-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Aura Farmer',
  handle text NOT NULL DEFAULT 'aura',
  aura integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  multiplier numeric NOT NULL DEFAULT 1,
  pass_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- POSTS (pruebas de Aura)
CREATE TABLE public.aura_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  action text NOT NULL,
  detail text NOT NULL DEFAULT '',
  points integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Disciplina',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX aura_posts_created_at_idx ON public.aura_posts (created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.aura_posts TO authenticated;
GRANT ALL ON public.aura_posts TO service_role;
ALTER TABLE public.aura_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feed readable by authenticated users" ON public.aura_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create their own posts" ON public.aura_posts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete their own posts" ON public.aura_posts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- VOTES
CREATE TABLE public.post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.aura_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  vote text NOT NULL CHECK (vote IN ('real', 'cap')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_votes TO authenticated;
GRANT ALL ON public.post_votes TO service_role;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Votes readable by authenticated users" ON public.post_votes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage their own votes" ON public.post_votes
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- HABITS
CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'habit' CHECK (kind IN ('habit', 'slip')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX habits_user_idx ON public.habits (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own habits" ON public.habits
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- HABIT LOGS
CREATE TABLE public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  logged_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, logged_on)
);
CREATE INDEX habit_logs_user_day_idx ON public.habit_logs (user_id, logged_on DESC);
GRANT SELECT, INSERT, DELETE ON public.habit_logs TO authenticated;
GRANT ALL ON public.habit_logs TO service_role;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own habit logs" ON public.habit_logs
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ZONES (public catalogue)
CREATE TABLE public.aura_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'Evento',
  x numeric NOT NULL DEFAULT 50,
  y numeric NOT NULL DEFAULT 50,
  multiplier text NOT NULL DEFAULT 'x1 Aura',
  people integer NOT NULL DEFAULT 0,
  detail text NOT NULL DEFAULT '',
  live boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aura_zones TO anon;
GRANT SELECT ON public.aura_zones TO authenticated;
GRANT ALL ON public.aura_zones TO service_role;
ALTER TABLE public.aura_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zones are public" ON public.aura_zones
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.aura_zones (name, kind, x, y, multiplier, people, detail, live) VALUES
  ('Parque del Retiro', 'Evento', 26, 30, 'x2 Aura', 148, 'Run club comunitario · 07:00', true),
  ('Iron Vault Gym', 'Patrocinado', 68, 22, 'x3 Aura', 92, 'Check-in patrocinado · todo el día', true),
  ('Biblioteca Central', 'Zona salvaje', 44, 58, 'x1.5 Aura', 37, 'Deep work silencioso · 2 h mínimo', false),
  ('Azotea Neón', 'Evento', 80, 44, 'x2.5 Aura', 264, 'Aura Battle abierta · 21:00', true),
  ('Mercado Sur', 'Patrocinado', 14, 66, 'x1.8 Aura', 61, 'Comida real, cero ultraprocesados', false);

-- CHECK-INS de zona
CREATE TABLE public.zone_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.aura_zones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.zone_checkins TO authenticated;
GRANT ALL ON public.zone_checkins TO service_role;
ALTER TABLE public.zone_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own checkins" ON public.zone_checkins
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
