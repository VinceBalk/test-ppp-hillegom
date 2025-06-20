
-- Create matches table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player1_id UUID REFERENCES public.players(id),
  player2_id UUID REFERENCES public.players(id),
  winner_id UUID REFERENCES public.players(id),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  match_date TIMESTAMP WITH TIME ZONE,
  round_number INTEGER DEFAULT 1,
  court_number TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tournament_players junction table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.tournament_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- Create specials table for special events (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.specials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  max_participants INTEGER,
  entry_fee NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Create settings table for system configuration (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matches
CREATE POLICY "Everyone can view matches" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organisators and admins can create matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (
  public.has_role_or_higher(auth.uid(), 'organisator')
);
CREATE POLICY "Organisators and admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'organisator')
);
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'beheerder')
);

-- RLS Policies for tournament_players
CREATE POLICY "Everyone can view tournament registrations" ON public.tournament_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Players can register themselves" ON public.tournament_players FOR INSERT TO authenticated WITH CHECK (
  player_id IN (SELECT id FROM public.players WHERE created_by = auth.uid()) OR
  public.has_role_or_higher(auth.uid(), 'organisator')
);
CREATE POLICY "Organisators and admins can manage registrations" ON public.tournament_players FOR UPDATE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'organisator')
);
CREATE POLICY "Organisators and admins can delete registrations" ON public.tournament_players FOR DELETE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'organisator')
);

-- RLS Policies for specials
CREATE POLICY "Everyone can view specials" ON public.specials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organisators and admins can create specials" ON public.specials FOR INSERT TO authenticated WITH CHECK (
  public.has_role_or_higher(auth.uid(), 'organisator')
);
CREATE POLICY "Organisators and admins can update specials" ON public.specials FOR UPDATE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'organisator')
);
CREATE POLICY "Admins can delete specials" ON public.specials FOR DELETE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'beheerder')
);

-- RLS Policies for settings
CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (
  public.has_role_or_higher(auth.uid(), 'beheerder')
);
CREATE POLICY "Only admins can update settings" ON public.settings FOR UPDATE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'beheerder')
);
CREATE POLICY "Only admins can delete settings" ON public.settings FOR DELETE TO authenticated USING (
  public.has_role_or_higher(auth.uid(), 'beheerder')
);

-- Insert default settings (only if they don't exist)
INSERT INTO public.settings (key, value, description) 
SELECT 'app_name', '"PPP Hillegom"', 'Application name'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'app_name');

INSERT INTO public.settings (key, value, description) 
SELECT 'tournament_default_max_players', '16', 'Default maximum players for tournaments'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'tournament_default_max_players');

INSERT INTO public.settings (key, value, description) 
SELECT 'match_default_court_count', '4', 'Default number of courts available'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'match_default_court_count');

INSERT INTO public.settings (key, value, description) 
SELECT 'registration_open_days_before', '7', 'Days before tournament when registration opens'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'registration_open_days_before');

-- Add indexes for better performance (using IF NOT EXISTS where possible)
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON public.matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament ON public.tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_player ON public.tournament_players(player_id);
CREATE INDEX IF NOT EXISTS idx_specials_date ON public.specials(event_date);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
